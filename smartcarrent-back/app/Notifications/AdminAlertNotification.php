<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

/**
 * Notification generique pour les alertes admin (nouveau client inscrit,
 * voiture mise en maintenance, etc.). Stockee uniquement en base de donnees.
 */
class AdminAlertNotification extends Notification
{
    use Queueable;

    public function __construct(
        private readonly string $event,
        private readonly string $title,
        private readonly string $message,
        private readonly array $context = []
    ) {
    }

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        return array_merge([
            'event' => $this->event,
            'title' => $this->title,
            'message' => $this->message,
            'created_at' => now()->toIso8601String(),
        ], $this->context);
    }
}
