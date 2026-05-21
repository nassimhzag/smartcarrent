<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Paiement extends Model
{
    use HasFactory;

    protected $fillable = [
        'reservation_id',
        'montant',
        'date_paiement',
        'mode_paiement',
        'statut',
        'date_validation',
        'date_remboursement',
    ];

    protected $casts = [
        'date_paiement' => 'date',
        'date_validation' => 'datetime',
        'date_remboursement' => 'datetime',
    ];

    public function reservation()
    {
        return $this->belongsTo(Reservation::class, 'reservation_id');
    }
}
