<?php

namespace App\Notifications;

use App\Models\Reservation;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class ReservationNotification extends Notification
{
    use Queueable;

    public function __construct(
        private readonly Reservation $reservation,
        private readonly string $event
    ) {
    }

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        $voiture = $this->reservation->voiture?->modele ?? 'vehicule';
        $reference = 'RES-' . $this->reservation->id;

        return [
            'event' => $this->event,
            'title' => $this->titleForEvent($reference),
            'message' => $this->messageForEvent($reference, $voiture),
            'reservation_id' => $this->reservation->id,
            'reservation_status' => $this->reservation->statut,
            'voiture_id' => $this->reservation->voiture_id,
            'client_id' => $this->reservation->client_id,
            'created_at' => now()->toIso8601String(),
        ];
    }

    private function titleForEvent(string $reference): string
    {
        return match ($this->event) {
            'created' => "Nouvelle reservation {$reference}",
            'cancelled' => "Reservation annulee {$reference}",
            'status_changed' => "Mise a jour reservation {$reference}",
            default => "Notification reservation {$reference}",
        };
    }

    private function messageForEvent(string $reference, string $voiture): string
    {
        return match ($this->event) {
            'created' => "La reservation {$reference} pour {$voiture} a ete creee.",
            'cancelled' => "La reservation {$reference} pour {$voiture} a ete annulee.",
            'status_changed' => "La reservation {$reference} est maintenant au statut {$this->reservation->statut}.",
            default => "Mise a jour sur la reservation {$reference}.",
        };
    }
}
