<?php

namespace Database\Factories;

use App\Models\Marque;
use App\Models\Voiture;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Voiture>
 */
class VoitureFactory extends Factory
{
    protected $model = Voiture::class;

    public function definition(): array
    {
        $categorie = $this->faker->randomElement([
            'SUV', 'Berline', 'Citadine', 'Luxe', 'Utilitaire',
        ]);

        // Fourchette de prix realiste par categorie (DT/jour).
        $prixRange = match ($categorie) {
            'SUV'        => [180, 320],
            'Berline'    => [120, 220],
            'Citadine'   => [70, 130],
            'Luxe'       => [400, 750],
            'Utilitaire' => [150, 280],
            default      => [100, 200],
        };

        $modeles = match ($categorie) {
            'SUV'        => ['Tucson', 'Sportage', 'RAV4', 'Q5', 'X3', 'CR-V', 'T-Roc'],
            'Berline'    => ['Megane', 'Civic', 'Corolla', 'A4', 'Serie 3', 'Passat'],
            'Citadine'   => ['Clio', 'Polo', '208', 'Picanto', 'i10', 'Sandero'],
            'Luxe'       => ['Classe E', 'Serie 5', 'A8', 'Classe S', 'Panamera'],
            'Utilitaire' => ['Kangoo', 'Berlingo', 'Doblo', 'Partner', 'Caddy'],
            default      => ['Generic'],
        };

        // Banque d'images Unsplash (libres) categorisees.
        $imagesByCat = [
            'SUV'        => 'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?auto=format&fit=crop&w=900&q=80',
            'Berline'    => 'https://images.unsplash.com/photo-1553440569-bcc63803a83d?auto=format&fit=crop&w=900&q=80',
            'Citadine'   => 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&w=900&q=80',
            'Luxe'       => 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=900&q=80',
            'Utilitaire' => 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=900&q=80',
        ];

        return [
            'marque_id'       => Marque::query()->inRandomOrder()->value('id') ?? Marque::factory(),
            'immatriculation' => strtoupper($this->faker->bothify('###?? TUN')),
            'modele'          => $this->faker->randomElement($modeles),
            'annee'           => $this->faker->numberBetween(2018, 2025),
            'prix_par_jour'   => $this->faker->numberBetween($prixRange[0], $prixRange[1]),
            'statut'          => 'disponible',
            'image_path'      => null, // image_url construit a partir de storage; on laisse null, image_url fallback s'affiche
            'categorie'       => $categorie,
        ];
    }
}
