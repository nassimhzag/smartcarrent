<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOneThrough;

class Reservation extends Model
{
    use HasFactory;

    protected $fillable = [
        'client_id',
        'voiture_id',
        'date_debut',
        'date_fin',
        'statut',
    ];

    protected $casts = [
        'date_debut' => 'date',
        'date_fin' => 'date',
    ];

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class, 'client_id');
    }

    public function voiture(): BelongsTo
    {
        return $this->belongsTo(Voiture::class, 'voiture_id');
    }

    public function paiement()
    {
        return $this->hasOne(Paiement::class, 'reservation_id');
    }

    public function utilisateur(): HasOneThrough
    {
        return $this->hasOneThrough(
            Utilisateur::class,
            Client::class,
            'id',
            'id',
            'client_id',
            'user_id'
        );
    }
}
