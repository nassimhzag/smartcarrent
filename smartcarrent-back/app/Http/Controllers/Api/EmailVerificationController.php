<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Mail\EmailOtpMail;
use App\Models\EmailOtp;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\ValidationException;

class EmailVerificationController extends Controller
{
    /**
     * Cree un nouvel OTP pour un utilisateur et envoie le mail correspondant.
     * Toujours supprimer les anciens OTP avant d'en creer un nouveau pour
     * garantir qu'un seul code soit valide a la fois.
     *
     * Retourne l'OTP cree (utile pour exposer expires_at au frontend).
     */
    public static function issueForUser(User $user): EmailOtp
    {
        EmailOtp::where('user_id', $user->id)->delete();

        $otp = EmailOtp::create([
            'user_id' => $user->id,
            'code' => EmailOtp::generateCode(),
            'expires_at' => EmailOtp::defaultExpiresAt(),
            'attempts' => 0,
        ]);

        Mail::to($user->email)->send(new EmailOtpMail($user, $otp));

        return $otp;
    }

    /**
     * POST /api/auth/verify-otp
     *
     * Verifie le code OTP saisi par l'utilisateur. Si valide :
     *  - email_verified_at est renseigne
     *  - l'OTP est supprime
     *  - un token Sanctum est emis (l'utilisateur est connecte)
     *
     * Si invalide : incremente le compteur d'essais et renvoie 422.
     * Apres MAX_ATTEMPTS echecs, l'OTP est invalide et l'utilisateur doit
     * demander un nouveau code.
     */
    public function verify(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email' => ['required', 'email'],
            'code' => ['required', 'string', 'size:' . EmailOtp::CODE_LENGTH],
        ]);

        $user = User::with(['client', 'admin'])->where('email', $data['email'])->first();

        if (! $user) {
            throw ValidationException::withMessages([
                'email' => 'Aucun compte trouve pour cette adresse email.',
            ]);
        }

        if ($user->email_verified_at) {
            throw ValidationException::withMessages([
                'email' => 'Ce compte est deja verifie. Veuillez vous connecter.',
            ]);
        }

        $otp = EmailOtp::where('user_id', $user->id)->latest()->first();

        if (! $otp) {
            throw ValidationException::withMessages([
                'code' => 'Aucun code en cours pour ce compte. Demandez un nouveau code.',
            ]);
        }

        if ($otp->isExpired()) {
            throw ValidationException::withMessages([
                'code' => 'Ce code a expire. Demandez un nouveau code pour continuer.',
            ]);
        }

        if ($otp->hasReachedMaxAttempts()) {
            throw ValidationException::withMessages([
                'code' => 'Trop de tentatives. Demandez un nouveau code pour continuer.',
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

        // Succes : marquer comme verifie + emettre un token Sanctum.
        $user->forceFill(['email_verified_at' => now()])->save();
        EmailOtp::where('user_id', $user->id)->delete();

        // Un seul token actif a la fois (coherent avec AuthController).
        $user->tokens()->delete();
        $token = $user->createToken(
            $request->userAgent() ?? 'unknown-device',
            [],
            now()->addDays(30)
        )->plainTextToken;

        return response()->json([
            'message' => 'Votre compte est desormais verifie. Bienvenue !',
            'user' => $user->fresh()->loadMissing(['client', 'admin']),
            'token_type' => 'Bearer',
            'token' => $token,
            'redirect_to' => $user->isAdmin() ? '/admin/dashboard' : '/client/dashboard',
            'space' => $user->role,
        ]);
    }

    /**
     * POST /api/auth/resend-otp
     *
     * Renvoie un nouveau code OTP. Respecte un cooldown anti-spam
     * (RESEND_COOLDOWN_SECONDS). Repond 200 generique meme si l'email
     * n'existe pas, pour ne pas leak l'existence de comptes.
     */
    public function resend(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email' => ['required', 'email'],
        ]);

        $user = User::where('email', $data['email'])->first();

        if (! $user || $user->email_verified_at) {
            // Reponse generique : on ne dit pas si le compte existe ou est deja verifie.
            return response()->json([
                'message' => 'Si un compte non verifie est associe a cet email, un nouveau code vient d\'etre envoye.',
                'expires_in_minutes' => EmailOtp::TTL_MINUTES,
            ]);
        }

        // Anti-spam : cooldown entre deux envois.
        $previous = EmailOtp::where('user_id', $user->id)->latest()->first();
        if ($previous && ! $previous->canResend()) {
            throw ValidationException::withMessages([
                'email' => sprintf(
                    'Veuillez patienter %d seconde%s avant de demander un nouveau code.',
                    $previous->secondsBeforeResend(),
                    $previous->secondsBeforeResend() > 1 ? 's' : ''
                ),
            ]);
        }

        $otp = self::issueForUser($user);

        return response()->json([
            'message' => 'Un nouveau code de verification vient d\'etre envoye a votre adresse email.',
            'expires_at' => $otp->expires_at->toIso8601String(),
            'expires_in_minutes' => EmailOtp::TTL_MINUTES,
        ]);
    }
}
