<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Client extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'permis_conduire',
        'telephone',
        'adresse',
    ];

    public function utilisateur()
    {
        return $this->belongsTo(Utilisateur::class, 'user_id');
    }

    public function user()
    {
        return $this->utilisateur();
    }

    public function reservations()
    {
        return $this->hasMany(Reservation::class, 'client_id');
    }

    public function predictions()
    {
        return $this->hasMany(Prediction::class, 'client_id');
    }

    public function recommendations()
    {
        return $this->hasMany(Recommendation::class, 'client_id');
    }
}
