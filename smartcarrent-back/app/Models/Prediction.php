<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Prediction extends Model
{
    use HasFactory;

    protected $fillable = [
        'client_id',
        'type',
        'probabilite',
    ];

    public function client()
    {
        return $this->belongsTo(Client::class, 'client_id');
    }
}
