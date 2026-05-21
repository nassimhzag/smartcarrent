<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Recommendation extends Model
{
    use HasFactory;

    protected $fillable = [
        'client_id',
        'voiture_id',
        'score',
        'date',
    ];

    public function client()
    {
        return $this->belongsTo(Client::class, 'client_id');
    }

    public function voiture()
    {
        return $this->belongsTo(Voiture::class, 'voiture_id');
    }
}
