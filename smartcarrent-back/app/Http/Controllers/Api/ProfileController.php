<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

/**
 * Gestion du profil utilisateur connecte.
 *
 * Routes :
 *   - PUT /api/me/profile   { name, telephone?, adresse? }
 *   - PUT /api/me/password  { current_password, password, password_confirmation }
 *
 * Toutes les routes sont protegees par auth:sanctum.
 */
class ProfileController extends Controller
{
    public function updateProfile(Request $request): JsonResponse
    {
        $user = $request->user();
        abort_unless($user, 401, 'Authentification requise.');

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'telephone' => ['nullable', 'string', 'max:50'],
            'adresse' => ['nullable', 'string', 'max:255'],
        ]);

        // Le nom est sur Utilisateur ; telephone et adresse sont sur Client.
        $user->update(['name' => $data['name']]);

        if ($user->client) {
            $user->client->update([
                'telephone' => $data['telephone'] ?? $user->client->telephone,
                'adresse' => $data['adresse'] ?? $user->client->adresse,
            ]);
        }

        return response()->json([
            'message' => 'Profil mis a jour avec succes.',
            'user' => $user->fresh()->loadMissing(['client', 'admin']),
        ]);
    }

    public function changePassword(Request $request): JsonResponse
    {
        $user = $request->user();
        abort_unless($user, 401, 'Authentification requise.');

        $data = $request->validate([
            'current_password' => ['required', 'string'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        if (! Hash::check($data['current_password'], $user->password)) {
            throw ValidationException::withMessages([
                'current_password' => 'Le mot de passe actuel est incorrect.',
            ]);
        }

        // Mise a jour du mot de passe (cast 'hashed' applique automatiquement).
        $user->update(['password' => $data['password']]);

        // Securite : on revoque tous les autres tokens pour forcer une
        // reconnexion ailleurs. Le token courant est conserve pour eviter
        // de deconnecter l'utilisateur sur l'appareil qui vient de changer
        // son mot de passe.
        $current = $user->currentAccessToken();
        $user->tokens()->where('id', '!=', $current?->id)->delete();

        return response()->json([
            'message' => 'Mot de passe mis a jour avec succes.',
        ]);
    }
}
