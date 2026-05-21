<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\AuthLoginRequest;
use App\Http\Requests\Api\AuthRegisterRequest;
use App\Models\Client;
use App\Models\User;
use App\Notifications\AdminAlertNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function register(AuthRegisterRequest $request): JsonResponse
    {
        $data = $request->validated();

        $user = User::create([
            'name'     => $data['name'],
            'email'    => $data['email'],
            'password' => $data['password'],
            'role'     => 'utilisateur',
        ]);

        $client = Client::create([
            'user_id'         => $user->id,
            'permis_conduire' => $data['permis_conduire'],
            'telephone'       => $data['telephone'] ?? null,
            'adresse'         => $data['adresse'],
        ]);

        // Notifier tous les admins qu'un nouveau client vient de s'inscrire.
        User::query()
            ->where('role', 'admin')
            ->get()
            ->each(function (User $admin) use ($user): void {
                $admin->notify(new AdminAlertNotification(
                    event: 'new_client',
                    title: 'Nouvelle inscription client',
                    message: "Le client {$user->name} ({$user->email}) vient de creer un compte.",
                    context: ['client_id' => $user->id, 'client_email' => $user->email]
                ));
            });

        // حذف كل التوكنات القديمة قبل إنشاء واحد جديد
        $user->tokens()->delete();

        $deviceName = $request->userAgent() ?? 'unknown-device';
        $token = $user->createToken($deviceName, [], now()->addDays(30))->plainTextToken;

        return response()->json([
            'message'     => 'Compte client créé avec succès.',
            'user'        => $user->fresh()->loadMissing(['client', 'admin']),
            'client'      => $client->load('utilisateur'),
            'token_type'  => 'Bearer',
            'token'       => $token,
            'redirect_to' => $this->dashboardPathFor($user),
        ], 201);
    }

    public function login(AuthLoginRequest $request): JsonResponse
    {
        $credentials = $request->validated();

        $user = User::with(['client', 'admin'])->where('email', $credentials['email'])->first();

        if (! $user || ! Hash::check($credentials['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => __('Les identifiants sont incorrects.'),
            ]);
        }

        // حذف كل التوكنات القديمة — كل login = توكن واحد فقط نشط
        $user->tokens()->delete();

        $deviceName = $request->userAgent() ?? 'unknown-device';
        $token = $user->createToken($deviceName, [], now()->addDays(30))->plainTextToken;

        return response()->json([
            'message'     => 'Connexion réussie.',
            'user'        => $user,
            'token_type'  => 'Bearer',
            'token'       => $token,
            'redirect_to' => $this->dashboardPathFor($user),
            'space'       => $user->role,
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        // حذف التوكن الحالي فقط
        $request->user()?->currentAccessToken()?->delete();

        return response()->json([
            'message' => 'Deconnexion reussie.',
        ]);
    }

    public function me(Request $request): JsonResponse
    {
        $user = $request->user()->loadMissing(['client', 'admin']);

        return response()->json([
            'user'        => $user,
            'redirect_to' => $this->dashboardPathFor($user),
            'space'       => $user->role,
        ]);
    }

    public function dashboard(Request $request): JsonResponse
    {
        $user = $request->user()->loadMissing(['client', 'admin']);

        return response()->json([
            'space'       => $user->role,
            'redirect_to' => $this->dashboardPathFor($user),
        ]);
    }

    private function dashboardPathFor(User $user): string
    {
        return $user->isAdmin() ? '/admin/dashboard' : '/client/dashboard';
    }
}