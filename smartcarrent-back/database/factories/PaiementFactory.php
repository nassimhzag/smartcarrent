<?php

namespace Database\Factories;

use App\Models\Paiement;
use App\Models\Reservation;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Paiement>
 *
 * Statuts autorises (apres migration suppression de 'echoue') :
 *  - en_attente
 *  - paye
 *  - rembourse
 */
class PaiementFactory extends Factory
{
    protected $model = Paiement::class;

    public function definition(): array
    {
        return [
            'reservation_id'     => Reservation::factory(),
            'montant'            => $this->faker->numberBetween(150, 2000),
            'date_paiement'      => now()->toDateString(),
            'mode_paiement'      => $this->faker->randomElement([
                'carte', 'virement', 'especes', 'mobile_money',
            ]),
            'statut'             => 'en_attente',
            'date_validation'    => null,
            'date_remboursement' => null,
        ];
    }

    public function paye(): self
    {
        return $this->state(fn () => [
            'statut'          => 'paye',
            'date_validation' => now(),
        ]);
    }

    public function rembourse(): self
    {
        return $this->state(fn () => [
            'statut'             => 'rembourse',
            'date_validation'    => now()->subDays(2),
            'date_remboursement' => now(),
        ]);
    }
}
