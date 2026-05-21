<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Calendrier extends Model
{
    use HasFactory;

    protected $fillable = [
        'voiture_id',
        'date_debut',
        'date_fin',
        'disponible',
    ];

    protected $casts = [
        'disponible' => 'boolean',
    ];

    public function voiture()
    {
        return $this->belongsTo(Voiture::class, 'voiture_id');
    }
}
