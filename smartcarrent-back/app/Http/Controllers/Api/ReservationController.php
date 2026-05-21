<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\ReservationStoreRequest;
use App\Http\Requests\Api\ReservationUpdateRequest;
use App\Models\Calendrier;
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
            $data['statut'] = 'en_attente_paiement';
        }

        $status = $data['statut'] ?? 'en_attente_paiement';
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

        if (! $isAdmin && $reservation->paiement()->exists()) {
            throw ValidationException::withMessages([
                'reservation' => 'Une reservation deja payee ne peut pas etre annulee par l utilisateur.',
            ]);
        }

        $reservation->update(['statut' => 'annulee']);
        // Annulation cote API : seul l'admin peut transitionner vers 'annulee' (le client ne
        // passe pas par cette route grace a canTransition). On notifie donc le client.
        $this->dispatchReservationNotification($reservation, 'cancelled', 'client');

        return response()->json([
            'message' => 'Reservation annulee avec succes.',
            'reservation' => $reservation->load(['client.utilisateur', 'voiture', 'paiement']),
        ]);
    }

    public function destroy(Reservation $reservation): JsonResponse
    {
        $user = request()->user();
        $this->assertCanAccessReservation($user, $reservation);

        if (! $user->isAdmin()) {
            if (! in_array($reservation->statut, ['en_attente_paiement', 'annulee'], true) || $reservation->paiement()->exists()) {
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

    private function canTransition(string $from, string $to, bool $isAdmin): bool
    {
        if ($from === $to) {
            return true;
        }

        if ($isAdmin) {
            $transitions = [
                'en_attente_paiement' => ['confirmee', 'annulee'],
                'confirmee' => ['terminee', 'annulee'],
                'annulee' => [],
                'terminee' => [],
            ];

            return in_array($to, $transitions[$from] ?? [], true);
        }

        // Le client ne peut plus annuler une reservation : toute transition de statut
        // est interdite cote client. Seul l'admin peut agir via remboursement / suppression.
        return false;
    }

    private function ensureNoDateConflict(int $voitureId, string $dateDebut, string $dateFin, ?int $currentReservationId, string $nextStatus): void
    {
        if (! in_array($nextStatus, ['en_attente_paiement', 'confirmee'], true)) {
            return;
        }

        $calendarConflict = Calendrier::query()
            ->where('voiture_id', $voitureId)
            ->where('disponible', false)
            ->whereDate('date_debut', '<=', $dateFin)
            ->whereDate('date_fin', '>=', $dateDebut)
            ->exists();

        if ($calendarConflict) {
            throw ValidationException::withMessages([
                'dates' => 'La voiture est indisponible sur cette periode (calendrier).',
            ]);
        }

        $conflictQuery = Reservation::query()
            ->where('voiture_id', $voitureId)
            ->whereIn('statut', ['en_attente_paiement', 'confirmee'])
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

        // Destinataire : le client (proprietaire de la reservation)
        if (($recipient === 'client' || $recipient === 'both') && $owner) {
            $owner->notify(new ReservationNotification($reservation, $event));
        }

        // Destinataire : les admins (on saute l'admin qui est aussi proprietaire)
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
