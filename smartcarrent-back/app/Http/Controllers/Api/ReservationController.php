<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\ReservationStoreRequest;
use App\Http\Requests\Api\ReservationUpdateRequest;
use App\Models\Reservation;
use App\Models\User;
use App\Notifications\ReservationNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class ReservationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = request()->user();
        $perPage = min(max((int) $request->query('per_page', 10), 1), 100);

        $query = Reservation::with(['client.utilisateur', 'voiture', 'paiement'])->latest();

        if (! $user->isAdmin()) {
            abort_if(! $user->client, 403, 'Profil client introuvable.');
            $query->where('client_id', $user->client->id);
        }

        return response()->json($query->paginate($perPage)->appends($request->query()));
    }

    public function history(Request $request): JsonResponse
    {
        $user = $request->user();
        $perPage = min(max((int) $request->query('per_page', 10), 1), 100);

        $query = Reservation::with(['client.utilisateur', 'voiture', 'paiement'])
            ->latest();

        if (! $user->isAdmin()) {
            abort_if(! $user->client, 403, 'Profil client introuvable.');
            $query->where('client_id', $user->client->id);
        } elseif ($request->filled('user_id')) {
            $targetUser = User::with('client')->findOrFail((int) $request->query('user_id'));
            abort_if(! $targetUser->client, 422, 'Le profil utilisateur cible ne possede pas de compte client.');
            $query->where('client_id', $targetUser->client->id);
        }

        if ($request->filled('statut')) {
            $query->where('statut', (string) $request->query('statut'));
        }

        if ($request->filled('date_from')) {
            $query->whereDate('date_debut', '>=', (string) $request->query('date_from'));
        }

        if ($request->filled('date_to')) {
            $query->whereDate('date_fin', '<=', (string) $request->query('date_to'));
        }

        return response()->json($query->paginate($perPage)->appends($request->query()));
    }

    public function store(ReservationStoreRequest $request): JsonResponse
    {
        $user = $request->user();
        $isAdmin = $user->isAdmin();
        $data = $request->validated();

        if (! $isAdmin) {
            abort_if(! $user->client, 403, 'Profil client introuvable.');
            $data['client_id'] = $user->client->id;
            $data['statut'] = 'en_cours';
        }

        // Une reservation est toujours creee en 'en_cours'. La dimension
        // financiere (paye / en_attente / rembourse) est portee par le paiement.
        $status = $data['statut'] ?? 'en_cours';
        $this->ensureNoDateConflict($data['voiture_id'], $data['date_debut'], $data['date_fin'], null, $status);

        $reservation = Reservation::create($data);
        // Nouvelle reservation creee par le client : notifier uniquement les admins.
        $this->dispatchReservationNotification($reservation, 'created', 'admin');

        return response()->json($reservation->load(['client.utilisateur', 'voiture', 'paiement']), 201);
    }

    public function show(Reservation $reservation): JsonResponse
    {
        $this->assertCanAccessReservation(request()->user(), $reservation);

        return response()->json($reservation->load(['client.utilisateur', 'voiture', 'paiement']));
    }

    public function update(ReservationUpdateRequest $request, Reservation $reservation): JsonResponse
    {
        $user = $request->user();
        $isAdmin = $user->isAdmin();
        $this->assertCanAccessReservation($user, $reservation);
        $data = $request->validated();

        $currentStatus = $reservation->statut;
        $nextStatus = $data['statut'] ?? $currentStatus;

        if (! $this->canTransition($currentStatus, $nextStatus, $isAdmin)) {
            throw ValidationException::withMessages([
                'statut' => 'Transition de statut non autorisee.',
            ]);
        }

        // Invariant 1 : pas de passage a 'terminee' sans paiement valide.
        if ($nextStatus === 'terminee' && optional($reservation->paiement)->statut !== 'paye') {
            throw ValidationException::withMessages([
                'statut' => 'Impossible de cloturer la reservation : le paiement n est pas encore paye.',
            ]);
        }

        // Invariant 3 : pas de passage a 'terminee' avant la date de fin de location.
        if ($nextStatus === 'terminee') {
            $today = \Carbon\Carbon::today();
            $dateFin = $reservation->date_fin instanceof \Carbon\Carbon
                ? $reservation->date_fin->copy()->startOfDay()
                : \Carbon\Carbon::parse((string) $reservation->date_fin)->startOfDay();
            if ($dateFin->greaterThan($today)) {
                throw ValidationException::withMessages([
                    'date_fin' => 'Impossible de cloturer : la date de fin de location n est pas encore atteinte.',
                ]);
            }
        }

        $voitureId = $data['voiture_id'] ?? $reservation->voiture_id;
        $dateDebut = $data['date_debut'] ?? $reservation->date_debut;
        $dateFin = $data['date_fin'] ?? $reservation->date_fin;

        $this->ensureNoDateConflict($voitureId, $dateDebut, $dateFin, $reservation->id, $nextStatus);

        $reservation->update($data);

        if ($currentStatus !== $reservation->statut) {
            // Changement de statut declenche par un admin : notifier uniquement le client.
            $this->dispatchReservationNotification($reservation, 'status_changed', 'client');
        }

        return response()->json($reservation->load(['client.utilisateur', 'voiture', 'paiement']));
    }

    public function cancel(Reservation $reservation): JsonResponse
    {
        $user = request()->user();
        $isAdmin = $user->isAdmin();
        $this->assertCanAccessReservation($user, $reservation);

        if (! $this->canTransition($reservation->statut, 'annulee', $isAdmin)) {
            throw ValidationException::withMessages([
                'statut' => 'Annulation non autorisee pour cette reservation.',
            ]);
        }

        // Le client ne peut annuler que si aucun paiement n'a ete encaisse.
        // S'il a deja paye, il doit contacter l'agence (passage par admin/refund).
        if (! $isAdmin && optional($reservation->paiement)->statut === 'paye') {
            throw ValidationException::withMessages([
                'reservation' => 'Une reservation deja payee ne peut pas etre annulee directement. Veuillez contacter l agence pour un remboursement.',
            ]);
        }

        $reservation->update(['statut' => 'annulee']);
        $this->dispatchReservationNotification($reservation, 'cancelled', 'client');

        return response()->json([
            'message' => 'Reservation annulee avec succes.',
            'reservation' => $reservation->load(['client.utilisateur', 'voiture', 'paiement']),
        ]);
    }

    /**
     * Action admin : cloturer une reservation (le client a rendu le vehicule).
     *
     * INVARIANTS METIER :
     *  1. La reservation doit etre 'en_cours'.
     *  2. Le paiement doit etre deja 'paye'.
     *  3. La date de fin de location doit etre atteinte (date_fin <= today).
     *     On ne peut pas cloturer une location dont la periode n'a pas
     *     encore expire — le client n'a pas pu rendre le vehicule.
     */
    public function terminer(Reservation $reservation): JsonResponse
    {
        abort_if(! request()->user()->isAdmin(), 403, 'Action reservee a un administrateur.');

        if ($reservation->statut !== 'en_cours') {
            throw ValidationException::withMessages([
                'reservation' => 'Seule une reservation en cours peut etre cloturee.',
            ]);
        }

        $paiement = $reservation->paiement;
        if (! $paiement || $paiement->statut !== 'paye') {
            throw ValidationException::withMessages([
                'paiement' => 'Impossible de cloturer : le paiement n est pas encore paye. Confirmez le paiement avant de cloturer la location.',
            ]);
        }

        // Garde-fou date : on n'accepte la cloture qu'a partir de date_fin.
        // Carbon::today() compare au debut du jour courant ; date_fin est cast
        // en date par le modele Reservation.
        $today = \Carbon\Carbon::today();
        $dateFin = $reservation->date_fin instanceof \Carbon\Carbon
            ? $reservation->date_fin->copy()->startOfDay()
            : \Carbon\Carbon::parse((string) $reservation->date_fin)->startOfDay();

        if ($dateFin->greaterThan($today)) {
            throw ValidationException::withMessages([
                'date_fin' => 'Impossible de cloturer : la date de fin de location n est pas encore atteinte ('
                    . $dateFin->locale('fr')->isoFormat('DD MMMM YYYY')
                    . '). La location est encore en cours.',
            ]);
        }

        $reservation->update(['statut' => 'terminee']);
        // Notification client : la location est officiellement terminee.
        $this->dispatchReservationNotification($reservation, 'completed', 'client');

        return response()->json([
            'message' => 'Reservation cloturee avec succes. Le vehicule est de nouveau disponible.',
            'reservation' => $reservation->load(['client.utilisateur', 'voiture', 'paiement']),
        ]);
    }

    public function destroy(Reservation $reservation): JsonResponse
    {
        $user = request()->user();
        $this->assertCanAccessReservation($user, $reservation);

        if (! $user->isAdmin()) {
            // Cote client : suppression autorisee uniquement si la reservation est
            // annulee et qu'aucun paiement n'a ete encaisse.
            $paiementStatut = optional($reservation->paiement)->statut;
            $hasEncashedPayment = in_array($paiementStatut, ['paye', 'rembourse'], true);
            if ($reservation->statut !== 'annulee' || $hasEncashedPayment) {
                throw ValidationException::withMessages([
                    'reservation' => 'Suppression non autorisee pour cette reservation.',
                ]);
            }
        }

        $reservation->delete();

        return response()->json(null, 204);
    }

    private function assertCanAccessReservation($user, Reservation $reservation): void
    {
        if ($user->isAdmin()) {
            return;
        }

        abort_if(! $user->client, 403, 'Profil client introuvable.');
        abort_if((int) $reservation->client_id !== (int) $user->client->id, 403, 'Action non autorisee.');
    }

    /**
     * Table des transitions autorisees apres simplification de l'enum :
     *   en_cours  -> terminee | annulee   (admin uniquement)
     *   en_cours  -> annulee              (client si paiement = en_attente)
     *   terminee  -> (final)
     *   annulee   -> (final)
     */
    private function canTransition(string $from, string $to, bool $isAdmin): bool
    {
        if ($from === $to) {
            return true;
        }

        if ($isAdmin) {
            $transitions = [
                'en_cours' => ['terminee', 'annulee'],
                'annulee'  => [],
                'terminee' => [],
            ];

            return in_array($to, $transitions[$from] ?? [], true);
        }

        // Le client peut uniquement annuler une reservation 'en_cours'
        // (la verif paiement=en_attente est faite dans cancel()).
        return $from === 'en_cours' && $to === 'annulee';
    }

    private function ensureNoDateConflict(int $voitureId, string $dateDebut, string $dateFin, ?int $currentReservationId, string $nextStatus): void
    {
        // On ne verifie le conflit que si la reservation cible est 'en_cours'
        // (les statuts terminee et annulee ne bloquent pas).
        if ($nextStatus !== 'en_cours') {
            return;
        }

        $conflictQuery = Reservation::query()
            ->where('voiture_id', $voitureId)
            ->where('statut', 'en_cours')
            ->whereDate('date_debut', '<=', $dateFin)
            ->whereDate('date_fin', '>=', $dateDebut);

        if ($currentReservationId) {
            $conflictQuery->where('id', '!=', $currentReservationId);
        }

        if ($conflictQuery->exists()) {
            throw ValidationException::withMessages([
                'dates' => 'La voiture est deja reservee sur cette periode.',
            ]);
        }
    }

    /**
     * Dispatch une notification liee a une reservation au destinataire approprie.
     *
     * @param string $recipient 'admin' (tous les admins), 'client' (proprietaire),
     *                          'both' (les deux — uniquement pour retro-compat,
     *                          a eviter selon la nouvelle logique metier).
     */
    private function dispatchReservationNotification(
        Reservation $reservation,
        string $event,
        string $recipient = 'client'
    ): void {
        $reservation->loadMissing(['client.utilisateur', 'voiture']);
        $ownerId = $reservation->client?->user_id;
        $owner = $ownerId ? User::find($ownerId) : null;

        if (($recipient === 'client' || $recipient === 'both') && $owner) {
            $owner->notify(new ReservationNotification($reservation, $event));
        }

        if ($recipient === 'admin' || $recipient === 'both') {
            User::query()
                ->where('role', 'admin')
                ->get()
                ->each(function (User $admin) use ($reservation, $event, $owner): void {
                    if ($owner && (int) $owner->id === (int) $admin->id) {
                        return;
                    }
                    $admin->notify(new ReservationNotification($reservation, $event));
                });
        }
    }
}
