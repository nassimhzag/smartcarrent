<?php

namespace App\Mail;

use App\Models\Paiement;
use App\Models\Reservation;
use Carbon\Carbon;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class ReservationConfirmedMail extends Mailable
{
    use Queueable, SerializesModels;

    public Reservation $reservation;
    public ?Paiement $paiement;
    public string $clientName;
    public string $voitureLabel;
    public string $immatriculation;
    public string $dateDebut;
    public string $dateFin;
    public int $jours;
    public float $montant;
    public string $modePaiement;
    public string $reference;

    public function __construct(Reservation $reservation, ?Paiement $paiement = null)
    {
        $this->reservation = $reservation;
        $this->paiement = $paiement;

        $reservation->loadMissing(['client.utilisateur', 'voiture.marque']);

        $this->clientName = $reservation->client?->utilisateur?->name ?? 'Client';
        $voitureModele = $reservation->voiture?->modele ?? '—';
        $marque = $reservation->voiture?->marque?->nom;
        $this->voitureLabel = $marque ? "{$marque} — {$voitureModele}" : $voitureModele;
        $this->immatriculation = $reservation->voiture?->immatriculation ?? '—';

        $start = Carbon::parse($reservation->date_debut);
        $end = Carbon::parse($reservation->date_fin);
        $this->dateDebut = $start->locale('fr')->isoFormat('LL');
        $this->dateFin = $end->locale('fr')->isoFormat('LL');
        $this->jours = max($start->diffInDays($end) + 1, 1);

        $this->montant = (float) ($paiement?->montant ?? 0);
        $this->modePaiement = $this->labelMode($paiement?->mode_paiement);
        $this->reference = 'RES-' . $reservation->id;
    }

    public function build()
    {
        return $this
            ->subject("SmartCarRent — Reservation {$this->reference} confirmee")
            ->view('emails.reservation_confirmed');
    }

    private function labelMode(?string $mode): string
    {
        return match ($mode) {
            'carte' => 'Carte bancaire',
            'especes' => 'Paiement sur place',
            'virement' => 'Virement bancaire',
            'mobile_money' => 'Mobile Money',
            default => $mode ?? '—',
        };
    }
}
