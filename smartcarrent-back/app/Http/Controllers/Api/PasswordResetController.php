<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\EmailOtp;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

/**
 * Reinitialisation de mot de passe par code OTP envoye par email.
 *
 * Reutilise l'infrastructure de EmailOtp (table, modele, mailable).
 * Flow :
 *   1. POST /api/auth/forgot-password  { email }
 *      -> si compte trouve, on envoie un OTP (sinon reponse generique).
 *   2. POST /api/auth/reset-password   { email, code, password, password_confirmation }
 *      -> verifie code + met a jour password + revoque tokens.
 *
 * Apres reinitialisation, le client doit se reconnecter normalement.
 */
class PasswordResetController extends Controller
{
    public function forgot(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email' => ['required', 'email'],
        ]);

        $user = User::where('email', $data['email'])->first();

        // Si le compte existe, on emet un nouvel OTP. La reponse reste
        // generique pour ne pas reveler l'existence d'un compte (anti-enumeration).
        if ($user) {
            EmailVerificationController::issueForUser($user);
        }

        return response()->json([
            'message' => 'Si un compte est associe a cette adresse, un code de reinitialisation vient d\'etre envoye.',
            'email' => $data['email'],
            'expires_in_minutes' => EmailOtp::TTL_MINUTES,
        ]);
    }

    public function reset(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email' => ['required', 'email'],
            'code' => ['required', 'string', 'size:' . EmailOtp::CODE_LENGTH],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        $user = User::where('email', $data['email'])->first();

        if (! $user) {
            throw ValidationException::withMessages([
                'email' => 'Aucun compte trouve pour cette adresse.',
            ]);
        }

        $otp = EmailOtp::where('user_id', $user->id)->latest()->first();

        if (! $otp) {
            throw ValidationException::withMessages([
                'code' => 'Aucun code en cours. Veuillez demander un nouveau code.',
            ]);
        }

        if ($otp->isExpired()) {
            throw ValidationException::withMessages([
                'code' => 'Ce code a expire. Veuillez en demander un nouveau.',
            ]);
        }

        if ($otp->hasReachedMaxAttempts()) {
            throw ValidationException::withMessages([
                'code' => 'Trop de tentatives. Veuillez demander un nouveau code.',
            ]);
        }

        if (! $otp->matches($data['code'])) {
            $otp->increment('attempts');
            $remaining = max(0, EmailOtp::MAX_ATTEMPTS - $otp->attempts);

            throw ValidationException::withMessages([
                'code' => sprintf(
                    'Code incorrect. %d tentative%s restante%s.',
                    $remaining,
                    $remaining > 1 ? 's' : '',
                    $remaining > 1 ? 's' : ''
                ),
            ]);
        }

        // Succes : mise a jour du mot de passe (cast 'hashed' applique automatiquement).
        $user->update(['password' => $data['password']]);

        // Supprimer l'OTP et revoquer tous les tokens existants.
        EmailOtp::where('user_id', $user->id)->delete();
        $user->tokens()->delete();

        return response()->json([
            'message' => 'Votre mot de passe a ete reinitialise avec succes. Vous pouvez maintenant vous connecter.',
        ]);
    }
}
