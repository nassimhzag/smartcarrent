<?php

namespace Database\Factories;

use App\Models\Client;
use App\Models\Reservation;
use App\Models\Voiture;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Reservation>
 *
 * Par defaut on cree une reservation passee de duree 2-7 jours, statut au
 * hasard parmi les 4 statuts metier. Le seeder peut surcharger ces champs
 * (date_debut / statut / client_id / voiture_id) pour controler la repartition.
 */
class ReservationFactory extends Factory
{
    protected $model = Reservation::class;

    public function definition(): array
    {
        $start = Carbon::now()->subDays($this->faker->numberBetween(1, 180));
        $duration = $this->faker->numberBetween(2, 7);

        return [
            'client_id'  => Client::factory(),
            'voiture_id' => Voiture::factory(),
            'date_debut' => $start->toDateString(),
            'date_fin'   => $start->copy()->addDays($duration)->toDateString(),
            'statut'     => $this->faker->randomElement([
                'en_attente_paiement', 'confirmee', 'annulee', 'terminee',
            ]),
        ];
    }
}
