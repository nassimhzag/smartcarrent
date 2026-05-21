<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\PaiementStoreRequest;
use App\Http\Requests\Api\PaiementUpdateRequest;
use App\Mail\ReservationConfirmedMail;
use App\Models\Paiement;
use App\Models\Reservation;
use App\Models\User;
use App\Notifications\AdminAlertNotification;
use App\Notifications\ReservationNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\ValidationException;

class PaiementController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = request()->user();
        $perPage = min(max((int) $request->query('per_page', 10), 1), 100);

        $query = Paiement::with(['reservation.client.utilisateur', 'reservation.voiture'])->latest();

        if (! $user->isAdmin()) {
            abort_if(! $user->client, 403, 'Profil client introuvable.');
            $query->whereHas('reservation', function ($q) use ($user): void {
                $q->where('client_id', $user->client->id);
            });
        }

        return response()->json($query->paginate($perPage)->appends($request->query()));
    }

    /**
     * Cree un paiement pour une reservation 'en_attente_paiement'.
     *
     * Workflow selon la methode de paiement :
     *  - especes : paiement cree en 'en_attente', la reservation reste 'en_attente_paiement'.
     *    L'admin devra ensuite "Annuler" (rejectPayment) si le client ne paie pas sur place.
     *  - carte, virement, mobile_money : paiement cree en 'paye', la reservation est
     *    automatiquement confirmee et le client est notifie.
     */
    public function store(PaiementStoreRequest $request): JsonResponse
    {
        $user = $request->user();
        $data = $request->validated();

        $reservation = Reservation::with('paiement')->findOrFail($data['reservation_id']);

        if (! $user->isAdmin()) {
            abort_if(! $user->client, 403, 'Profil client introuvable.');
            abort_if((int) $reservation->client_id !== (int) $user->client->id, 403, 'Action non autorisee.');
        }

        if ($reservation->statut !== 'en_attente_paiement') {
            throw ValidationException::withMessages([
                'reservation_id' => 'Le paiement est autorise uniquement pour une reservation en attente de paiement.',
            ]);
        }

        if ($reservation->paiement) {
            throw ValidationException::withMessages([
                'reservation_id' => 'Cette reservation est deja payee.',
            ]);
        }

        $isCash = ($data['mode_paiement'] ?? null) === 'especes';

        if ($isCash) {
            // Paiement sur place : argent pas encore recu. On enregistre le paiement
            // mais on laisse la reservation en attente de confirmation.
            $data['statut'] = 'en_attente';
            $data['date_validation'] = null;
        } else {
            // Paiement en ligne (carte, virement, mobile_money) : simule le succes.
            $data['statut'] = 'paye';
            $data['date_validation'] = now();
        }

        $paiement = Paiement::create($data);

        if (! $isCash) {
            // Confirmation automatique pour les paiements en ligne (carte).
            $reservation->update(['statut' => 'confirmee']);
            // Notifier le CLIENT : sa reservation est confirmee.
            $this->notifyReservation($reservation, 'status_changed');
            $this->sendConfirmationEmail($reservation, $paiement);

            // Notifier les ADMINS : un paiement vient d'etre recu.
            $clientName = $reservation->client?->utilisateur?->name ?? 'Client';
            $voitureLabel = $reservation->voiture?->modele ?? 'voiture';
            $montant = number_format((float) $paiement->montant, 2);
            $this->notifyAdmins(
                event: 'payment_received',
                title: 'Paiement recu',
                message: "Le client {$clientName} a paye {$montant} DT pour {$voitureLabel}.",
                context: ['paiement_id' => $paiement->id, 'reservation_id' => $reservation->id]
            );
        }

        return response()->json($paiement->load(['reservation.client.utilisateur', 'reservation.voiture']), 201);
    }

    /**
     * Action admin : confirmer manuellement un paiement sur place.
     * Le paiement passe de 'en_attente' a 'paye' et la reservation est confirmee.
     * Un email de confirmation est envoye au client.
     */
    public function confirmCashPayment(Paiement $paiement): JsonResponse
    {
        abort_if(! request()->user()->isAdmin(), 403, 'Action reservee a un administrateur.');

        if ($paiement->statut !== 'en_attente') {
            throw ValidationException::withMessages([
                'paiement' => 'Seul un paiement en attente peut etre confirme.',
            ]);
        }

        if ($paiement->mode_paiement !== 'especes') {
            throw ValidationException::withMessages([
                'paiement' => 'La confirmation manuelle est reservee aux paiements sur place (especes).',
            ]);
        }

        $paiement->update([
            'statut' => 'paye',
            'date_validation' => now(),
        ]);

        $reservation = $paiement->reservation;
        if ($reservation && $reservation->statut !== 'confirmee') {
            $reservation->update(['statut' => 'confirmee']);
            // Action declenchee par l'admin : seul le client est notifie.
            $this->notifyReservation($reservation, 'status_changed');
        }

        $this->sendConfirmationEmail($reservation, $paiement);

        return response()->json($paiement->load(['reservation.client.utilisateur', 'reservation.voiture']));
    }

    private function sendConfirmationEmail(?Reservation $reservation, ?Paiement $paiement): void
    {
        if (! $reservation) {
            return;
        }

        $reservation->loadMissing(['client.utilisateur', 'voiture.marque']);
        $email = $reservation->client?->utilisateur?->email;

        if (! $email) {
            return;
        }

        try {
            Mail::to($email)->send(new ReservationConfirmedMail($reservation, $paiement));
        } catch (\Throwable $e) {
            // On ne fait pas echouer la transaction metier si l'email plante.
            // Le mailer est en mode 'log' par defaut, donc tres robuste.
        }
    }

    /**
     * Action admin : refuser un paiement.
     * Le paiement passe a 'echoue' et la reservation liee est annulee.
     */
    public function rejectPayment(Paiement $paiement): JsonResponse
    {
        abort_if(! request()->user()->isAdmin(), 403, 'Action reservee a un administrateur.');

        if (! in_array($paiement->statut, ['en_attente', 'paye'], true)) {
            throw ValidationException::withMessages([
                'paiement' => 'Seul un paiement en attente ou paye peut etre refuse.',
            ]);
        }

        $paiement->update([
            'statut' => 'echoue',
        ]);

        // Cascade : la reservation liee est annulee.
        // Action declenchee par l'admin : seul le client est notifie.
        $reservation = $paiement->reservation;
        if ($reservation && $reservation->statut !== 'annulee') {
            $reservation->update(['statut' => 'annulee']);
            $this->notifyReservation($reservation, 'cancelled');
        }

        return response()->json($paiement->load(['reservation.client.utilisateur', 'reservation.voiture']));
    }

    /**
     * Action admin : rembourser un paiement.
     * Le paiement passe a 'rembourse' et la reservation liee est annulee.
     */
    public function refundPayment(Paiement $paiement): JsonResponse
    {
        abort_if(! request()->user()->isAdmin(), 403, 'Action reservee a un administrateur.');

        if ($paiement->statut !== 'paye') {
            throw ValidationException::withMessages([
                'paiement' => 'Seul un paiement paye peut etre rembourse.',
            ]);
        }

        $paiement->update([
            'statut' => 'rembourse',
            'date_remboursement' => now(),
        ]);

        // Cascade : la reservation liee est annulee (la voiture redevient
        // automatiquement disponible dans le calendrier).
        // Action declenchee par l'admin : seul le client est notifie.
        $reservation = $paiement->reservation;
        if ($reservation && $reservation->statut !== 'annulee') {
            $reservation->update(['statut' => 'annulee']);
            $this->notifyReservation($reservation, 'cancelled');
        }

        return response()->json($paiement->load(['reservation.client.utilisateur', 'reservation.voiture']));
    }

    public function show(Paiement $paiement): JsonResponse
    {
        $this->assertCanAccessPayment(request()->user(), $paiement);

        return response()->json($paiement->load(['reservation.client.utilisateur', 'reservation.voiture']));
    }

    public function update(PaiementUpdateRequest $request, Paiement $paiement): JsonResponse
    {
        abort_if(! $request->user()->isAdmin(), 403, 'Action reservee a un administrateur.');
        $data = $request->validated();

        if (isset($data['reservation_id'])) {
            $reservation = Reservation::findOrFail($data['reservation_id']);
            if (! in_array($reservation->statut, ['en_attente_paiement', 'confirmee'], true)) {
                throw ValidationException::withMessages([
                    'reservation_id' => 'Le paiement doit etre lie a une reservation active.',
                ]);
            }
        }

        $paiement->update($data);

        return response()->json($paiement->load(['reservation.client.utilisateur', 'reservation.voiture']));
    }

    public function destroy(Paiement $paiement): JsonResponse
    {
        abort_if(! request()->user()->isAdmin(), 403, 'Action reservee a un administrateur.');

        $paiement->delete();

        return response()->json(null, 204);
    }

    private function assertCanAccessPayment($user, Paiement $paiement): void
    {
        if ($user->isAdmin()) {
            return;
        }

        abort_if(! $user->client, 403, 'Profil client introuvable.');
        abort_if((int) $paiement->reservation->client_id !== (int) $user->client->id, 403, 'Action non autorisee.');
    }

    /**
     * Notifie le proprietaire (client) d'une reservation. Utilise quand un admin
     * (ou une action systeme) modifie le statut.
     */
    private function notifyReservation(Reservation $reservation, string $event): void
    {
        $reservation->loadMissing(['client.utilisateur', 'voiture']);
        $ownerId = $reservation->client?->user_id;
        $owner = $ownerId ? User::find($ownerId) : null;

        if ($owner) {
            $owner->notify(new ReservationNotification($reservation, $event));
        }
    }

    /**
     * Envoie une alerte aux administrateurs. Utilise quand le client effectue
     * une action que l'admin doit voir (nouveau paiement en ligne, etc.).
     */
    private function notifyAdmins(string $event, string $title, string $message, array $context = []): void
    {
        User::query()
            ->where('role', 'admin')
            ->get()
            ->each(function (User $admin) use ($event, $title, $message, $context): void {
                $admin->notify(new AdminAlertNotification($event, $title, $message, $context));
            });
    }
}
