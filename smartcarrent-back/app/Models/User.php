<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\HasManyThrough;

class User extends Utilisateur
{
	public function reservations(): HasManyThrough
	{
		return $this->hasManyThrough(
			Reservation::class,
			Client::class,
			'user_id',
			'client_id',
			'id',
			'id'
		);
	}
}


