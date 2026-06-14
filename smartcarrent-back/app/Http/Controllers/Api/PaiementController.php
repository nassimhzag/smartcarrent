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
     * Cree un paiement pour une reservation 'en_cours' qui n'a pas encore de paiement.
     *
     * NOUVELLE LOGIQUE METIER UNIFIEE :
     * Quel que soit le mode de paiement choisi (carte, virement, mobile_money,
     * especes), le paiement est immediatement marque 'paye' avec
     * date_validation = now(). Il n'existe plus d'etape intermediaire ni de
     * validation manuelle par l'admin. La reservation reste 'en_cours' jusqu'a
     * sa cloture explicite par l'admin (via ReservationController::terminer).
     *
     * Un email de confirmation et une notification admin sont envoyes dans tous
     * les cas.
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

        if ($reservation->statut !== 'en_cours') {
            throw ValidationException::withMessages([
                'reservation_id' => 'Le paiement est autorise uniquement pour une reservation en cours.',
            ]);
        }

        if ($reservation->paiement) {
            throw ValidationException::withMessages([
                'reservation_id' => 'Cette reservation est deja payee.',
            ]);
        }

        // Logique unifiee : tous les paiements sont marques 'paye' immediatement.
        $data['statut'] = 'paye';
        $data['date_validation'] = now();

        $paiement = Paiement::create($data);

        // Email "Paiement recu" au client.
        $this->sendConfirmationEmail($reservation, $paiement);

        // Notifier les ADMINS : un paiement vient d'etre encaisse.
        $clientName = $reservation->client?->utilisateur?->name ?? 'Client';
        $voitureLabel = $reservation->voiture?->modele ?? 'voiture';
        $montant = number_format((float) $paiement->montant, 2);
        $this->notifyAdmins(
            event: 'payment_received',
            title: 'Paiement recu',
            message: "Le client {$clientName} a paye {$montant} DT pour {$voitureLabel}.",
            context: ['paiement_id' => $paiement->id, 'reservation_id' => $reservation->id]
        );

        return response()->json($paiement->load(['reservation.client.utilisateur', 'reservation.voiture']), 201);
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
        }
    }

    /**
     * Action admin : rembourser un paiement.
     * Le paiement passe a 'rembourse' et la reservation liee est annulee.
     * La voiture redevient automatiquement disponible.
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

        // Cascade metier : la reservation liee est annulee.
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
            if ($reservation->statut !== 'en_cours') {
                throw ValidationException::withMessages([
                    'reservation_id' => 'Le paiement doit etre lie a une reservation en cours.',
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
     * declenche une action (remboursement) qui modifie le statut.
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
     * Envoie une alerte aux administrateurs.
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
