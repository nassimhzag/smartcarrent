<?php

namespace Database\Seeders;

use App\Models\Client;
use App\Models\Marque;
use App\Models\Paiement;
use App\Models\Reservation;
use App\Models\User;
use App\Models\Voiture;
use Carbon\Carbon;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * ============================================================================
 *  DemoDataSeeder
 * ----------------------------------------------------------------------------
 *  Peuple la base avec un volume realiste de donnees de demonstration pour la
 *  soutenance / les tests :
 *    - marques (au moins 10)
 *    - voitures (~30) avec categories et prix varies
 *    - clients (~25) avec users associes (role=utilisateur)
 *    - reservations etalees sur 6 mois (statuts: en_attente_paiement, confirmee,
 *      annulee, terminee) pour bien remplir les graphiques du dashboard admin
 *    - paiements lies (statuts: en_attente, paye, rembourse)
 *
 *  Garanties :
 *    - n'efface AUCUNE donnee existante (pas de truncate / pas de delete)
 *    - ne touche PAS au compte administrateur ni aux marques/voitures deja en base
 *    - reutilise les enregistrements existants si presents
 *    - peut etre re-execute sans risque (les nouvelles lignes s'ajoutent)
 *
 *  Lancement :
 *    php artisan db:seed --class=DemoDataSeeder
 *
 *  Pour tout regenerer en partant d'une base vierge :
 *    php artisan migrate:fresh --seed
 *    php artisan db:seed --class=DemoDataSeeder
 * ============================================================================
 */
class DemoDataSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        $this->command->info('=== DemoDataSeeder : generation de donnees de demonstration ===');

        // 1) MARQUES -----------------------------------------------------------
        $this->seedMarques();
        $marquesCount = Marque::count();
        $this->command->info("  Marques en base : {$marquesCount}");

        // 2) VOITURES ----------------------------------------------------------
        $this->seedVoitures(targetCount: 30);
        $voituresCount = Voiture::count();
        $this->command->info("  Voitures en base : {$voituresCount}");

        // 3) CLIENTS -----------------------------------------------------------
        $this->seedClients(targetCount: 25);
        $clientsCount = Client::count();
        $this->command->info("  Clients en base : {$clientsCount}");

        // 4) RESERVATIONS + PAIEMENTS -----------------------------------------
        $created = $this->seedReservationsAndPaiements(targetCount: 80);
        $this->command->info("  Reservations creees : {$created['reservations']}");
        $this->command->info("  Paiements crees     : {$created['paiements']}");

        $this->command->info('=== Termine. Les graphiques du dashboard admin sont prets. ===');
    }

    // ========================================================================
    //  Marques
    // ========================================================================
    private function seedMarques(): void
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

        foreach ($brands as $b) {
            // updateOrCreate sur 'nom' pour ne jamais dupliquer une marque existante.
            Marque::updateOrCreate(['nom' => $b['nom']], ['pays' => $b['pays']]);
        }
    }

    // ========================================================================
    //  Voitures
    // ========================================================================
    private function seedVoitures(int $targetCount): void
    {
        $existing = Voiture::count();
        $toCreate = max(0, $targetCount - $existing);
        if ($toCreate === 0) {
            return;
        }

        $marqueIds = Marque::query()->pluck('id')->all();

        $categories = ['SUV', 'Berline', 'Citadine', 'Luxe', 'Utilitaire'];

        $modelesByCat = [
            'SUV'        => ['Tucson', 'Sportage', 'RAV4', 'Q5', 'X3', 'CR-V', 'T-Roc', 'Captur'],
            'Berline'    => ['Megane', 'Civic', 'Corolla', 'A4', 'Serie 3', 'Passat', '308'],
            'Citadine'   => ['Clio', 'Polo', '208', 'Picanto', 'i10', 'Sandero', 'C3'],
            'Luxe'       => ['Classe E', 'Serie 5', 'A8', 'Classe S', 'Panamera', 'Range Rover'],
            'Utilitaire' => ['Kangoo', 'Berlingo', 'Doblo', 'Partner', 'Caddy', 'Transit'],
        ];

        $prixByCat = [
            'SUV'        => [180, 320],
            'Berline'    => [120, 220],
            'Citadine'   => [70, 130],
            'Luxe'       => [400, 750],
            'Utilitaire' => [150, 280],
        ];

        $imagesByCat = [
            'SUV'        => 'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?auto=format&fit=crop&w=900&q=80',
            'Berline'    => 'https://images.unsplash.com/photo-1553440569-bcc63803a83d?auto=format&fit=crop&w=900&q=80',
            'Citadine'   => 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&w=900&q=80',
            'Luxe'       => 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=900&q=80',
            'Utilitaire' => 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=900&q=80',
        ];

        for ($i = 0; $i < $toCreate; $i++) {
            $cat = $categories[array_rand($categories)];
            $modele = $modelesByCat[$cat][array_rand($modelesByCat[$cat])];
            [$pmin, $pmax] = $prixByCat[$cat];

            // Immatriculation unique facile a lire : 6 chiffres + ' TUN' (format demo).
            do {
                $imm = sprintf('%06d TUN', mt_rand(100000, 999999));
            } while (Voiture::where('immatriculation', $imm)->exists());

            Voiture::create([
                'marque_id'       => $marqueIds[array_rand($marqueIds)],
                'immatriculation' => $imm,
                'modele'          => $modele,
                'annee'           => mt_rand(2018, 2025),
                'prix_par_jour'   => mt_rand($pmin, $pmax),
                'statut'          => 'disponible',
                // On utilise une URL externe pour l'image. L'accessor image_url
                // utilise asset('storage/'.path), donc on ne renseigne que si
                // l'image est en local. Pour la demo, on laisse null : le front
                // affiche un fallback elegant avec le nom de la marque.
                'image_path'      => null,
                'categorie'       => $cat,
            ]);
        }
    }

    // ========================================================================
    //  Clients (et leurs Users)
    // ========================================================================
    private function seedClients(int $targetCount): void
    {
        $existing = Client::count();
        $toCreate = max(0, $targetCount - $existing);
        if ($toCreate === 0) {
            return;
        }

        $prenoms = [
            'Yassine', 'Mohamed', 'Amine', 'Karim', 'Sami', 'Omar', 'Hamza', 'Bilel',
            'Salma', 'Fatma', 'Nour', 'Yasmine', 'Asma', 'Rania', 'Sirine', 'Imen',
            'Nadia', 'Sonia', 'Ahmed', 'Mehdi',
        ];
        $noms = [
            'Ben Ali', 'Triki', 'Chaabane', 'Bouazizi', 'Hamdi', 'Trabelsi', 'Mejri',
            'Belhaj', 'Saidi', 'Khelifi', 'Mansouri', 'Dridi', 'Gharbi', 'Jaouadi',
        ];
        $villes = ['Tunis', 'Sfax', 'Sousse', 'Bizerte', 'Gabes', 'Monastir', 'Nabeul', 'Kairouan'];
        $rues = [
            'Avenue Habib Bourguiba',
            'Rue de Marseille',
            'Avenue Mohamed V',
            'Beb Bhar',
            'Avenue de la Republique',
            'Rue Ibn Khaldoun',
            'Rue de la Liberte',
        ];

        for ($i = 0; $i < $toCreate; $i++) {
            $prenom = $prenoms[array_rand($prenoms)];
            $nom = $noms[array_rand($noms)];

            // Generer un email unique base sur prenom+nom+suffixe aleatoire.
            do {
                $email = strtolower($prenom . '.' . str_replace(' ', '', $nom)) . '+' . Str::random(4) . '@demo.tn';
            } while (User::where('email', $email)->exists());

            $user = User::create([
                'name'              => "{$prenom} {$nom}",
                'email'             => $email,
                'password'          => Hash::make('Demo123@'),
                'role'              => 'utilisateur',
                'email_verified_at' => now()->subDays(mt_rand(1, 120)),
            ]);

            // Permis et adresse uniques pour le client.
            do {
                $permis = 'PC' . strtoupper(Str::random(8));
            } while (Client::where('permis_conduire', $permis)->exists());

            Client::create([
                'user_id'         => $user->id,
                'permis_conduire' => $permis,
                'telephone'       => '+216 ' . mt_rand(20, 99) . ' ' . mt_rand(100, 999) . ' ' . mt_rand(100, 999),
                'adresse'         => $rues[array_rand($rues)] . ', ' . $villes[array_rand($villes)] . ', Tunisie',
            ]);
        }
    }

    // ========================================================================
    //  Reservations + Paiements
    // ========================================================================
    /**
     * Cree des reservations etalees sur 6 mois avec une repartition de statuts
     * cible et un paiement coherent pour chaque reservation.
     *
     * Repartition cible des statuts reservations :
     *   - terminee            : 50 %
     *   - confirmee           : 25 %
     *   - en_attente_paiement : 15 %
     *   - annulee             : 10 %
     *
     * Repartition cible des statuts paiements (deduits de la reservation) :
     *   - reservation terminee/confirmee -> paiement 'paye'
     *   - reservation en_attente_paiement -> paiement 'en_attente'
     *   - reservation annulee -> paiement 'rembourse' (si paiement avait ete fait)
     *                             ou 'en_attente' (si annulee avant paiement) — on
     *                             alterne pour avoir des cas varies.
     */
    private function seedReservationsAndPaiements(int $targetCount): array
    {
        $clientIds = Client::query()->pluck('id')->all();
        $voitureIds = Voiture::query()->pluck('id')->all();

        if (empty($clientIds) || empty($voitureIds)) {
            return ['reservations' => 0, 'paiements' => 0];
        }

        $createdResa = 0;
        $createdPay = 0;

        for ($i = 0; $i < $targetCount; $i++) {
            // Date de debut etalee sur les 6 derniers mois (180 jours).
            $daysAgo = mt_rand(0, 180);
            $start = Carbon::now()->subDays($daysAgo);
            $duration = mt_rand(2, 7);
            $end = $start->copy()->addDays($duration);

            // Statut tire selon la distribution cible.
            $statut = $this->pickWeightedStatut();

            // Cohérence : 'terminee' doit etre dans le passe.
            if ($statut === 'terminee' && $end->isFuture()) {
                // Decale dans le passe.
                $start = Carbon::now()->subDays(mt_rand(30, 180));
                $end = $start->copy()->addDays($duration);
            }

            $voitureId = $voitureIds[array_rand($voitureIds)];
            $clientId = $clientIds[array_rand($clientIds)];

            // IMPORTANT : created_at est protege par le mass-assignment ET
            // ecrase par les timestamps auto d'Eloquent. On contourne en
            // construisant l'instance, en desactivant les timestamps auto,
            // puis en forcant les valeurs historiques avant save().
            $resaCreated = $start->copy()->subDays(mt_rand(1, 5));
            $resaUpdated = $start->copy()->subDays(mt_rand(0, 1));

            $resa = new Reservation([
                'client_id'  => $clientId,
                'voiture_id' => $voitureId,
                'date_debut' => $start->toDateString(),
                'date_fin'   => $end->toDateString(),
                'statut'     => $statut,
            ]);
            $resa->timestamps = false;
            $resa->created_at = $resaCreated;
            $resa->updated_at = $resaUpdated;
            $resa->save();
            $createdResa++;

            // Paiement associe.
            $voiture = Voiture::find($voitureId);
            $montant = max(50, (int) $voiture->prix_par_jour * $duration);

            [$pStatut, $dateValid, $dateRemb] = $this->derivePaiementStateFromResa($statut, $resaCreated);

            $paiement = new Paiement([
                'reservation_id'     => $resa->id,
                'montant'            => $montant,
                'date_paiement'      => $resaCreated->toDateString(),
                'mode_paiement'      => $this->pickMode(),
                'statut'             => $pStatut,
                'date_validation'    => $dateValid,
                'date_remboursement' => $dateRemb,
            ]);
            $paiement->timestamps = false;
            $paiement->created_at = $resaCreated;
            $paiement->updated_at = $resaUpdated;
            $paiement->save();
            $createdPay++;
        }

        return ['reservations' => $createdResa, 'paiements' => $createdPay];
    }

    private function pickWeightedStatut(): string
    {
        // Tirage pondere.
        $r = mt_rand(1, 100);
        return match (true) {
            $r <= 50 => 'terminee',
            $r <= 75 => 'confirmee',
            $r <= 90 => 'en_attente_paiement',
            default  => 'annulee',
        };
    }

    private function pickMode(): string
    {
        $r = mt_rand(1, 100);
        return match (true) {
            $r <= 55 => 'carte',
            $r <= 75 => 'virement',
            $r <= 90 => 'especes',
            default  => 'mobile_money',
        };
    }

    /**
     * Retourne [statut_paiement, date_validation, date_remboursement] coherents
     * avec le statut de la reservation. Les dates de validation/remboursement
     * sont placees apres $resaCreated pour rester chronologiquement coherentes
     * avec la creation de la reservation.
     */
    private function derivePaiementStateFromResa(string $resaStatut, Carbon $resaCreated): array
    {
        switch ($resaStatut) {
            case 'terminee':
            case 'confirmee':
                return ['paye', $resaCreated->copy()->addDays(mt_rand(0, 3)), null];

            case 'en_attente_paiement':
                return ['en_attente', null, null];

            case 'annulee':
                // 50% : annulee apres paiement -> rembourse
                // 50% : annulee avant paiement -> en_attente
                if (mt_rand(0, 1) === 1) {
                    $validation = $resaCreated->copy()->addDays(mt_rand(0, 2));
                    $remboursement = $validation->copy()->addDays(mt_rand(1, 10));
                    return ['rembourse', $validation, $remboursement];
                }
                return ['en_attente', null, null];

            default:
                return ['en_attente', null, null];
        }
    }
}
