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
        'categorie',
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
     *  - 'maintenance' : si l'admin a explicitement positionne ce statut
     *  - 'reservee'    : s'il existe une reservation active (statut = en_cours)
     *                    qui couvre la date du jour
     *  - 'disponible'  : sinon
     *
     * La gestion manuelle du calendrier a ete supprimee : la disponibilite
     * d'un vehicule est desormais derivee uniquement du statut admin
     * (disponible/maintenance) et des reservations en cours.
     */
    public function getEffectiveStatutAttribute(): string
    {
        if ($this->statut === 'maintenance') {
            return 'maintenance';
        }

        $today = Carbon::today()->toDateString();

        $hasActiveReservation = $this->relationLoaded('reservations')
            ? $this->reservations
                ->filter(fn ($r) => $r->statut === 'en_cours')
                ->filter(fn ($r) => (string) $r->date_debut <= $today && (string) $r->date_fin >= $today)
                ->isNotEmpty()
            : Reservation::query()
                ->where('voiture_id', $this->id)
                ->where('statut', 'en_cours')
                ->whereDate('date_debut', '<=', $today)
                ->whereDate('date_fin', '>=', $today)
                ->exists();

        return $hasActiveReservation ? 'reservee' : 'disponible';
    }

    public function marque()
    {
        return $this->belongsTo(Marque::class, 'marque_id');
    }

    public function reservations()
    {
        return $this->hasMany(Reservation::class, 'voiture_id');
    }

    public function recommendations()
    {
        return $this->hasMany(Recommendation::class, 'voiture_id');
    }
}
