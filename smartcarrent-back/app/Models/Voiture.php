<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Voiture extends Model
{
    use HasFactory;

    protected $fillable = [
        'marque_id',
        'immatriculation',
        'modele',
        'annee',
        'prix_par_jour',
        'statut',
        'image_path',
    ];

    protected $appends = [
        'image_url',
        'effective_statut',
    ];

    public function getImageUrlAttribute(): ?string
    {
        if (! $this->image_path) {
            return null;
        }

        return asset('storage/' . ltrim($this->image_path, '/'));
    }

    /**
     * Statut effectif calcule dynamiquement :
     *  - 'maintenance' : si l'admin a force ce statut
     *  - 'reservee'    : s'il existe une reservation active (en_attente_paiement ou
     *                    confirmee) qui couvre la date du jour
     *  - 'reservee'    : si une plage calendrier bloquante (disponible=false) couvre today
     *  - 'disponible'  : sinon
     */
    public function getEffectiveStatutAttribute(): string
    {
        if ($this->statut === 'maintenance') {
            return 'maintenance';
        }

        $today = Carbon::today()->toDateString();

        // Reservations actives couvrant aujourd'hui
        $hasActiveReservation = $this->relationLoaded('reservations')
            ? $this->reservations
                ->filter(fn ($r) => in_array($r->statut, ['en_attente_paiement', 'confirmee'], true))
                ->filter(fn ($r) => (string) $r->date_debut <= $today && (string) $r->date_fin >= $today)
                ->isNotEmpty()
            : Reservation::query()
                ->where('voiture_id', $this->id)
                ->whereIn('statut', ['en_attente_paiement', 'confirmee'])
                ->whereDate('date_debut', '<=', $today)
                ->whereDate('date_fin', '>=', $today)
                ->exists();

        if ($hasActiveReservation) {
            return 'reservee';
        }

        // Plage calendrier bloquante couvrant aujourd'hui
        $hasCalendarBlock = $this->relationLoaded('calendriers')
            ? $this->calendriers
                ->filter(fn ($c) => ! $c->disponible)
                ->filter(fn ($c) => (string) $c->date_debut <= $today && (string) $c->date_fin >= $today)
                ->isNotEmpty()
            : Calendrier::query()
                ->where('voiture_id', $this->id)
                ->where('disponible', false)
                ->whereDate('date_debut', '<=', $today)
                ->whereDate('date_fin', '>=', $today)
                ->exists();

        if ($hasCalendarBlock) {
            return 'reservee';
        }

        return 'disponible';
    }

    public function marque()
    {
        return $this->belongsTo(Marque::class, 'marque_id');
    }

    public function reservations()
    {
        return $this->hasMany(Reservation::class, 'voiture_id');
    }

    public function calendriers()
    {
        return $this->hasMany(Calendrier::class, 'voiture_id');
    }

    public function recommendations()
    {
        return $this->hasMany(Recommendation::class, 'voiture_id');
    }
}
