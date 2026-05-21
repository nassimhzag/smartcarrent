<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthFlowTest extends TestCase
{
    use RefreshDatabase;

    public function test_register_creates_a_client_account_and_returns_the_client_dashboard(): void
    {
        $response = $this->postJson('/api/auth/register', [
            'name' => 'Nouveau Client',
            'email' => 'client@example.com',
            'password' => 'Password@123',
            'password_confirmation' => 'Password@123',
            'permis_conduire' => 'PERMIS-NEW-01',
            'telephone' => '0600000100',
            'adresse' => 'Agadir',
        ]);

        $response->assertCreated()
            ->assertJsonPath('redirect_to', '/client/dashboard')
            ->assertJsonPath('user.role', 'utilisateur');

        $this->assertDatabaseHas('users', [
            'email' => 'client@example.com',
            'role' => 'utilisateur',
        ]);

        $this->assertDatabaseHas('clients', [
            'permis_conduire' => 'PERMIS-NEW-01',
            'adresse' => 'Agadir',
        ]);
    }

    public function test_register_rejects_weak_passwords_with_a_clear_message(): void
    {
        $response = $this->postJson('/api/auth/register', [
            'name' => 'Nouveau Client',
            'email' => 'weak-password@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
            'permis_conduire' => 'PERMIS-WEAK-01',
            'telephone' => '0600000101',
            'adresse' => 'Agadir',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['password'])
            ->assertJsonPath('errors.password.0', 'mot de passe faible');
    }

    public function test_register_rejects_password_confirmation_mismatches_with_a_clear_message(): void
    {
        $response = $this->postJson('/api/auth/register', [
            'name' => 'Nouveau Client',
            'email' => 'confirm-error@example.com',
            'password' => 'Password@123',
            'password_confirmation' => 'Password@124',
            'permis_conduire' => 'PERMIS-CONF-01',
            'telephone' => '0600000102',
            'adresse' => 'Agadir',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['password'])
            ->assertJsonPath('errors.password.0', 'Erreur de confirmation du mot de passe');
    }

    public function test_register_rejects_duplicate_email_with_a_clear_message(): void
    {
        // create first account
        $this->postJson('/api/auth/register', [
            'name' => 'Client One',
            'email' => 'exists@example.com',
            'password' => 'Password@123',
            'password_confirmation' => 'Password@123',
            'permis_conduire' => 'PERMIS-EX-01',
            'telephone' => '0600000200',
            'adresse' => 'Rabat',
        ])->assertCreated();

        // attempt with same email
        $response = $this->postJson('/api/auth/register', [
            'name' => 'Client Two',
            'email' => 'exists@example.com',
            'password' => 'Password@123',
            'password_confirmation' => 'Password@123',
            'permis_conduire' => 'PERMIS-EX-02',
            'telephone' => '0600000201',
            'adresse' => 'Rabat',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email'])
            ->assertJsonPath('errors.email.0', 'Cet email est déjà utilisé');
    }

    public function test_register_rejects_duplicate_permis_with_a_clear_message(): void
    {
        // create first account
        $this->postJson('/api/auth/register', [
            'name' => 'Client A',
            'email' => 'perm1@example.com',
            'password' => 'Password@123',
            'password_confirmation' => 'Password@123',
            'permis_conduire' => 'PERMIS-DUP-01',
            'telephone' => '0600000300',
            'adresse' => 'Tanger',
        ])->assertCreated();

        // attempt with different email but same permis
        $response = $this->postJson('/api/auth/register', [
            'name' => 'Client B',
            'email' => 'perm2@example.com',
            'password' => 'Password@123',
            'password_confirmation' => 'Password@123',
            'permis_conduire' => 'PERMIS-DUP-01',
            'telephone' => '0600000301',
            'adresse' => 'Tanger',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['permis_conduire'])
            ->assertJsonPath('errors.permis_conduire.0', 'Ce permis est déjà utilisé');
    }

    public function test_login_returns_the_proper_dashboard_for_admin_and_client(): void
    {
        $admin = User::factory()->create([
            'role' => 'admin',
            'email' => 'admin@example.com',
        ]);

        $client = User::factory()->create([
            'role' => 'utilisateur',
            'email' => 'client2@example.com',
        ]);

        $adminResponse = $this->postJson('/api/auth/login', [
            'email' => 'admin@example.com',
            'password' => 'password',
        ]);

        $adminResponse->assertOk()->assertJsonPath('redirect_to', '/admin/dashboard');

        $this->postJson('/api/logout');

        $clientResponse = $this->postJson('/api/auth/login', [
            'email' => 'client2@example.com',
            'password' => 'password',
        ]);

        $clientResponse->assertOk()->assertJsonPath('redirect_to', '/client/dashboard');
    }

    public function test_dashboard_route_redirects_the_authenticated_user_to_their_space(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $client = User::factory()->create(['role' => 'utilisateur']);

        $this->actingAs($admin)->get('/dashboard')->assertRedirect('/admin/dashboard');
        $this->actingAs($client)->get('/dashboard')->assertRedirect('/client/dashboard');
    }
}