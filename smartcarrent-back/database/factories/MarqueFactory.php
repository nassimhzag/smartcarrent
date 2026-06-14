<?php

namespace Database\Factories;

use App\Models\Marque;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Marque>
 */
class MarqueFactory extends Factory
{
    protected $model = Marque::class;

    public function definition(): array
    {
        $brands = [
            ['nom' => 'Renault',       'pays' => 'France'],
            ['nom' => 'Peugeot',       'pays' => 'France'],
            ['nom' => 'Citroen',       'pays' => 'France'],
            ['nom' => 'Volkswagen',    'pays' => 'Allemagne'],
            ['nom' => 'BMW',           'pays' => 'Allemagne'],
            ['nom' => 'Mercedes-Benz', 'pays' => 'Allemagne'],
            ['nom' => 'Audi',          'pays' => 'Allemagne'],
            ['nom' => 'Toyota',        'pays' => 'Japon'],
            ['nom' => 'Honda',         'pays' => 'Japon'],
            ['nom' => 'Hyundai',       'pays' => 'Coree du Sud'],
            ['nom' => 'Kia',           'pays' => 'Coree du Sud'],
            ['nom' => 'Fiat',          'pays' => 'Italie'],
            ['nom' => 'Ford',          'pays' => 'Etats-Unis'],
            ['nom' => 'Dacia',         'pays' => 'Roumanie'],
        ];

        return $this->faker->randomElement($brands);
    }
}
