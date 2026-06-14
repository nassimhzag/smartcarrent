<?php

namespace Database\Factories;

use App\Models\Client;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Client>
 *
 * Cree un Client. Si user_id n'est pas fourni, cree automatiquement un User
 * (role=utilisateur) verifie pour qu'il puisse se connecter.
 */
class ClientFactory extends Factory
{
    protected $model = Client::class;

    public function definition(): array
    {
        return [
            'user_id'         => User::factory(),
            'permis_conduire' => strtoupper('PC' . Str::random(8)),
            'telephone'       => '+216 ' . $this->faker->numerify('## ### ###'),
            'adresse'         => $this->faker->randomElement([
                'Avenue Habib Bourguiba',
                'Rue de Marseille',
                'Avenue Mohamed V',
                'Beb Bhar',
                'Avenue de la Republique',
                'Rue Ibn Khaldoun',
            ]) . ', ' . $this->faker->randomElement([
                'Tunis', 'Sfax', 'Sousse', 'Bizerte', 'Gabes', 'Monastir',
            ]) . ', Tunisie',
        ];
    }
}
