<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

#[Fillable(['name', 'email', 'password', 'role', 'email_verified_at'])]
#[Hidden(['password', 'remember_token'])]
class Utilisateur extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    protected $table = 'users';

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    public function client()
    {
        return $this->hasOne(Client::class, 'user_id');
    }

    public function admin()
    {
        return $this->hasOne(Admin::class, 'user_id');
    }

    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    public function isUtilisateur(): bool
    {
        return in_array($this->role, ['utilisateur', 'client'], true);
    }

    public function hasRole(string ...$roles): bool
    {
        if ($roles === []) {
            return true;
        }

        foreach ($roles as $role) {
            if ($role === 'utilisateur' && $this->isUtilisateur()) {
                return true;
            }

            if ($role === 'client' && $this->isUtilisateur()) {
                return true;
            }

            if ($this->role === $role) {
                return true;
            }
        }

        return false;
    }
}
