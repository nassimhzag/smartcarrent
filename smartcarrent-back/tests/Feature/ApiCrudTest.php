<?php

namespace Tests\Feature;

use App\Models\Admin;
use App\Models\Calendrier;
use App\Models\Client;
use App\Models\Marque;
use App\Models\Paiement;
use App\Models\Prediction;
use App\Models\Recommendation;
use App\Models\Reservation;
use App\Models\User;
use App\Models\Voiture;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class ApiCrudTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_can_crud_clients_and_admins(): void
    {
        $adminUser = User::factory()->create(['role' => 'admin']);
        $clientUser = User::factory()->create(['role' => 'utilisateur']);

        $this->actingAs($adminUser);

        $clientPayload = [
            'user_id' => $clientUser->id,
            'permis_conduire' => 'PERMIS-001',
            'telephone' => '0600000001',
            'adresse' => 'Casablanca',
        ];

        $clientResponse = $this->postJson('/api/clients', $clientPayload);
        $clientResponse->assertCreated()->assertJsonFragment(['permis_conduire' => 'PERMIS-001']);

        $client = Client::firstOrFail();

        $this->getJson('/api/clients')->assertOk();
        $this->getJson('/api/clients/'.$client->id)->assertOk()->assertJsonFragment(['permis_conduire' => 'PERMIS-001']);

        $this->putJson('/api/clients/'.$client->id, [
            'user_id' => $clientUser->id,
            'permis_conduire' => 'PERMIS-002',
            'telephone' => '0600000002',
            'adresse' => 'Rabat',
        ])->assertOk()->assertJsonFragment(['permis_conduire' => 'PERMIS-002']);

        $this->deleteJson('/api/clients/'.$client->id)->assertNoContent();

        $adminResponse = $this->postJson('/api/admins', [
            'user_id' => $adminUser->id,
            'telephone' => '0700000001',
        ]);

        $adminResponse->assertCreated()->assertJsonFragment(['telephone' => '0700000001']);

        $admin = Admin::firstOrFail();
        $this->getJson('/api/admins/'.$admin->id)->assertOk();
        $this->putJson('/api/admins/'.$admin->id, [
            'user_id' => $adminUser->id,
            'telephone' => '0700000002',
        ])->assertOk()->assertJsonFragment(['telephone' => '0700000002']);
        $this->deleteJson('/api/admins/'.$admin->id)->assertNoContent();
    }

    public function test_it_can_crud_marques_and_voitures(): void
    {
        $adminUser = User::factory()->create(['role' => 'admin']);
        $this->actingAs($adminUser);

        $marque = $this->postJson('/api/marques', [
            'nom' => 'Toyota',
            'pays' => 'Japon',
        ])->assertCreated()->json();

        $marqueModel = Marque::firstOrFail();

        $this->getJson('/api/marques')->assertOk();
        $this->getJson('/api/marques/'.$marqueModel->id)->assertOk();

        $this->putJson('/api/marques/'.$marqueModel->id, [
            'nom' => 'Toyota Updated',
            'pays' => 'Japon',
        ])->assertOk()->assertJsonFragment(['nom' => 'Toyota Updated']);

        $voitureResponse = $this->postJson('/api/voitures', [
            'marque_id' => $marqueModel->id,
            'immatriculation' => '1234-AB-56',
            'modele' => 'Corolla',
            'annee' => 2024,
            'prix_par_jour' => 350,
            'statut' => 'disponible',
        ]);

        $voitureResponse->assertCreated()->assertJsonFragment(['modele' => 'Corolla']);

        $voiture = Voiture::firstOrFail();
        $this->getJson('/api/voitures')->assertOk();
        $this->getJson('/api/voitures/'.$voiture->id)->assertOk();

        $this->putJson('/api/voitures/'.$voiture->id, [
            'marque_id' => $marqueModel->id,
            'immatriculation' => '1234-AB-57',
            'modele' => 'Corolla Cross',
            'annee' => 2025,
            'prix_par_jour' => 400,
            'statut' => 'reservee',
        ])->assertOk()->assertJsonFragment(['modele' => 'Corolla Cross']);

        $this->deleteJson('/api/voitures/'.$voiture->id)->assertNoContent();
        $this->deleteJson('/api/marques/'.$marqueModel->id)->assertNoContent();
    }

    public function test_it_can_crud_reservations_and_paiements_and_calendriers(): void
    {
        $adminUser = User::factory()->create(['role' => 'admin']);
        $clientUser = User::factory()->create(['role' => 'utilisateur']);

        $this->actingAs($clientUser);
        $client = Client::create([
            'user_id' => $clientUser->id,
            'permis_conduire' => 'PERMIS-RES-01',
            'telephone' => '0600000003',
            'adresse' => 'Tanger',
        ]);

        $this->actingAs($adminUser);
        $marque = Marque::create(['nom' => 'Dacia', 'pays' => 'Roumanie']);

        $voiture = Voiture::create([
            'marque_id' => $marque->id,
            'immatriculation' => 'RES-123',
            'modele' => 'Sandero',
            'annee' => 2023,
            'prix_par_jour' => 250,
            'statut' => 'disponible',
        ]);

        $this->actingAs($clientUser);
        $reservationResponse = $this->postJson('/api/reservations', [
            'client_id' => $client->id,
            'voiture_id' => $voiture->id,
            'date_debut' => '2026-04-10',
            'date_fin' => '2026-04-12',
            'statut' => 'en_attente',
        ]);

        $reservationResponse->assertCreated()->assertJsonFragment(['statut' => 'en_attente']);

        $reservation = Reservation::firstOrFail();
        $this->getJson('/api/reservations')->assertOk();
        $this->getJson('/api/reservations/'.$reservation->id)->assertOk();

        $this->actingAs($adminUser);
        $this->putJson('/api/reservations/'.$reservation->id, [
            'client_id' => $client->id,
            'voiture_id' => $voiture->id,
            'date_debut' => '2026-04-11',
            'date_fin' => '2026-04-13',
            'statut' => 'confirmee',
        ])->assertOk()->assertJsonFragment(['statut' => 'confirmee']);

        $this->actingAs($clientUser);
        $paiementResponse = $this->postJson('/api/paiements', [
            'reservation_id' => $reservation->id,
            'montant' => 500,
            'date_paiement' => '2026-04-10',
            'mode_paiement' => 'carte',
        ]);

        $paiementResponse->assertCreated()->assertJsonFragment(['mode_paiement' => 'carte']);

        $paiement = Paiement::firstOrFail();
        $this->actingAs($adminUser);
        $this->getJson('/api/paiements/'.$paiement->id)->assertOk();

        $this->postJson('/api/calendriers', [
            'voiture_id' => $voiture->id,
            'date_debut' => '2026-04-10',
            'date_fin' => '2026-04-12',
            'disponible' => false,
        ])->assertCreated()->assertJsonFragment(['disponible' => false]);

        $calendrier = Calendrier::firstOrFail();
        $this->getJson('/api/calendriers/'.$calendrier->id)->assertOk();

        $this->deleteJson('/api/calendriers/'.$calendrier->id)->assertNoContent();
        $this->deleteJson('/api/paiements/'.$paiement->id)->assertNoContent();
        $this->deleteJson('/api/reservations/'.$reservation->id)->assertNoContent();
    }

    public function test_it_can_crud_predictions_and_recommendations(): void
    {
        $adminUser = User::factory()->create(['role' => 'admin']);
        $clientUser = User::factory()->create(['role' => 'utilisateur']);

        $this->actingAs($clientUser);
        $client = Client::create([
            'user_id' => $clientUser->id,
            'permis_conduire' => 'PERMIS-ML-01',
            'telephone' => '0600000004',
            'adresse' => 'Marrakech',
        ]);

        $this->actingAs($adminUser);
        $marque = Marque::create(['nom' => 'Renault', 'pays' => 'France']);
        $voiture = Voiture::create([
            'marque_id' => $marque->id,
            'immatriculation' => 'ML-456',
            'modele' => 'Clio',
            'annee' => 2024,
            'prix_par_jour' => 300,
            'statut' => 'disponible',
        ]);

        $this->actingAs($adminUser);
        $predictionResponse = $this->postJson('/api/predictions', [
            'client_id' => $client->id,
            'type' => 'retard',
            'probabilite' => 0.75,
        ]);

        $predictionResponse->assertCreated()->assertJsonFragment(['type' => 'retard']);

        $prediction = Prediction::firstOrFail();
        $this->getJson('/api/predictions/'.$prediction->id)->assertOk();

        $this->putJson('/api/predictions/'.$prediction->id, [
            'client_id' => $client->id,
            'type' => 'annulation',
            'probabilite' => 0.5,
        ])->assertOk()->assertJsonFragment(['type' => 'annulation']);

        $this->actingAs($clientUser);
        $recommendationResponse = $this->postJson('/api/recommendations', [
            'client_id' => $client->id,
            'voiture_id' => $voiture->id,
            'score' => 0.92,
            'date' => '2026-04-03',
        ]);

        $recommendationResponse->assertCreated()->assertJsonFragment(['score' => 0.92]);

        $recommendation = Recommendation::firstOrFail();
        $this->getJson('/api/recommendations/'.$recommendation->id)->assertOk();

        $this->deleteJson('/api/recommendations/'.$recommendation->id)->assertNoContent();
        $this->actingAs($adminUser);
        $this->deleteJson('/api/predictions/'.$prediction->id)->assertNoContent();
    }

    public function test_reservation_status_rules_and_payment_flow_are_enforced(): void
    {
        $adminUser = User::factory()->create(['role' => 'admin']);
        $clientUser = User::factory()->create(['role' => 'utilisateur']);

        $client = Client::create([
            'user_id' => $clientUser->id,
            'permis_conduire' => 'PERMIS-RULES-01',
            'telephone' => '0600000099',
            'adresse' => 'Fes',
        ]);

        $this->actingAs($adminUser);
        $marque = Marque::create(['nom' => 'Peugeot', 'pays' => 'France']);
        $voiture = Voiture::create([
            'marque_id' => $marque->id,
            'immatriculation' => 'RULE-001',
            'modele' => '208',
            'annee' => 2024,
            'prix_par_jour' => 320,
            'statut' => 'disponible',
        ]);

        $this->actingAs($clientUser);
        $reservation = $this->postJson('/api/reservations', [
            'client_id' => $client->id,
            'voiture_id' => $voiture->id,
            'date_debut' => '2026-05-01',
            'date_fin' => '2026-05-03',
        ])->assertCreated()->json();

        $this->putJson('/api/reservations/'.$reservation['id'], [
            'statut' => 'confirmee',
        ])->assertStatus(422);

        $this->postJson('/api/paiements', [
            'reservation_id' => $reservation['id'],
            'montant' => 960,
            'date_paiement' => '2026-05-01',
            'mode_paiement' => 'carte',
        ])->assertStatus(422);

        $this->actingAs($adminUser);
        $this->putJson('/api/reservations/'.$reservation['id'], [
            'statut' => 'confirmee',
        ])->assertOk()->assertJsonFragment(['statut' => 'confirmee']);

        $this->actingAs($clientUser);
        $paiement = $this->postJson('/api/paiements', [
            'reservation_id' => $reservation['id'],
            'montant' => 960,
            'date_paiement' => '2026-05-01',
            'mode_paiement' => 'carte',
        ])->assertCreated()->json();

        $this->actingAs($adminUser);
        $this->patchJson('/api/paiements/'.$paiement['id'].'/validate')->assertOk()->assertJsonFragment(['statut' => 'valide']);
        $this->patchJson('/api/paiements/'.$paiement['id'].'/refund')->assertOk()->assertJsonFragment(['statut' => 'rembourse']);
    }

    public function test_reservation_is_blocked_when_vehicle_is_marked_unavailable_in_calendar(): void
    {
        $adminUser = User::factory()->create(['role' => 'admin']);
        $clientUser = User::factory()->create(['role' => 'utilisateur']);

        $client = Client::create([
            'user_id' => $clientUser->id,
            'permis_conduire' => 'PERMIS-CAL-01',
            'telephone' => '0600099999',
            'adresse' => 'Agadir',
        ]);

        $this->actingAs($adminUser);
        $marque = Marque::create(['nom' => 'Hyundai', 'pays' => 'Coree']);
        $voiture = Voiture::create([
            'marque_id' => $marque->id,
            'immatriculation' => 'CAL-001',
            'modele' => 'i20',
            'annee' => 2025,
            'prix_par_jour' => 280,
            'statut' => 'disponible',
        ]);

        Calendrier::create([
            'voiture_id' => $voiture->id,
            'date_debut' => '2026-06-10',
            'date_fin' => '2026-06-12',
            'disponible' => false,
        ]);

        $this->actingAs($clientUser);
        $this->postJson('/api/reservations', [
            'client_id' => $client->id,
            'voiture_id' => $voiture->id,
            'date_debut' => '2026-06-11',
            'date_fin' => '2026-06-13',
        ])->assertStatus(422)->assertJsonValidationErrors(['dates']);
    }

    public function test_user_can_view_history_cancel_reservation_and_manage_notifications(): void
    {
        $adminUser = User::factory()->create(['role' => 'admin']);
        $clientUser = User::factory()->create(['role' => 'utilisateur']);

        $client = Client::create([
            'user_id' => $clientUser->id,
            'permis_conduire' => 'PERMIS-HIST-01',
            'telephone' => '0600001111',
            'adresse' => 'Casablanca',
        ]);

        $marque = Marque::create(['nom' => 'Kia', 'pays' => 'Coree']);
        $voiture = Voiture::create([
            'marque_id' => $marque->id,
            'immatriculation' => 'HIST-001',
            'modele' => 'Picanto',
            'annee' => 2025,
            'prix_par_jour' => 210,
            'statut' => 'disponible',
        ]);

        $this->actingAs($clientUser);
        $reservation = $this->postJson('/api/reservations', [
            'voiture_id' => $voiture->id,
            'date_debut' => '2026-07-01',
            'date_fin' => '2026-07-03',
        ])->assertCreated()->json();

        $this->assertDatabaseCount('notifications', 2);

        $this->getJson('/api/reservations/history')
            ->assertOk()
            ->assertJsonPath('data.0.id', $reservation['id']);

        $cancelResponse = $this->patchJson('/api/reservations/'.$reservation['id'].'/cancel')
            ->assertOk()
            ->assertJsonPath('reservation.statut', 'annulee')
            ->json();

        $this->assertSame('annulee', $cancelResponse['reservation']['statut']);
        $this->assertDatabaseCount('notifications', 4);

        $notifications = $this->getJson('/api/notifications?unread_only=true')
            ->assertOk()
            ->json();

        $this->assertGreaterThanOrEqual(1, $notifications['unread_count']);
        $firstNotificationId = $notifications['notifications']['data'][0]['id'];

        $this->patchJson('/api/notifications/'.$firstNotificationId.'/read')
            ->assertOk();

        $this->patchJson('/api/notifications/read-all')
            ->assertOk()
            ->assertJsonPath('unread_count', 0);

        $this->assertSame(0, DB::table('notifications')
            ->where('notifiable_type', User::class)
            ->where('notifiable_id', $clientUser->id)
            ->whereNull('read_at')
            ->count());
    }

    private function createClientUser(array $attributes = []): User
    {
        return User::factory()->create(array_merge(['role' => 'utilisateur'], $attributes));
    }

    private function createAdminUser(array $attributes = []): User
    {
        return User::factory()->create(array_merge(['role' => 'admin'], $attributes));
    }
}
