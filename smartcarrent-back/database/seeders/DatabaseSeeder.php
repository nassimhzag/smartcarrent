<?php

namespace Database\Seeders;

use App\Models\Admin;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     *
     * Cree uniquement le compte administrateur unique du site.
     * Les comptes clients sont crees par les utilisateurs eux-memes
     * via le formulaire d'inscription (role = utilisateur).
     */
    public function run(): void
    {
        $adminUser = User::updateOrCreate(
            ['email' => 'nassimhzag100@gmail.com'],
            [
                'name' => 'Nassim Hzag',
                'password' => Hash::make('Azerty123@'),
                'role' => 'admin',
                'email_verified_at' => now(),
            ]
        );

        Admin::updateOrCreate(
            ['user_id' => $adminUser->id],
            [
                'telephone' => null,
            ]
        );
    }
}
