<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;

/**
 * Code OTP de verification d'email.
 *
 * Constantes metier :
 *  - CODE_LENGTH      : longueur du code (6 chiffres)
 *  - TTL_MINUTES      : duree de validite du code (10 minutes)
 *  - MAX_ATTEMPTS     : nombre maximum de tentatives avant invalidation
 *  - RESEND_COOLDOWN  : cooldown minimal entre deux renvois (60 secondes)
 */
class EmailOtp extends Model
{
    use HasFactory;

    public const CODE_LENGTH = 6;
    public const TTL_MINUTES = 10;
    public const MAX_ATTEMPTS = 5;
    public const RESEND_COOLDOWN_SECONDS = 60;

    protected $fillable = [
        'user_id',
        'code',
        'expires_at',
        'attempts',
    ];

    protected $casts = [
        'expires_at' => 'datetime',
        'attempts' => 'integer',
    ];

    public function user()
    {
        return $this->belongsTo(Utilisateur::class, 'user_id');
    }

    /**
     * Genere un code numerique a 6 chiffres (zero-padded si besoin).
     */
    public static function generateCode(): string
    {
        return str_pad((string) random_int(0, 999999), self::CODE_LENGTH, '0', STR_PAD_LEFT);
    }

    /**
     * Date d'expiration par defaut pour un nouvel OTP.
     */
    public static function defaultExpiresAt(): Carbon
    {
        return now()->addMinutes(self::TTL_MINUTES);
    }

    public function isExpired(): bool
    {
        return $this->expires_at !== null && $this->expires_at->isPast();
    }

    public function hasReachedMaxAttempts(): bool
    {
        return $this->attempts >= self::MAX_ATTEMPTS;
    }

    /**
     * Indique si le code fourni correspond a celui stocke (comparaison
     * constant-time pour eviter les timing attacks).
     */
    public function matches(string $candidate): bool
    {
        return hash_equals($this->code, Str::of($candidate)->trim()->toString());
    }

    /**
     * Indique si un renvoi est autorise (anti-spam).
     */
    public function canResend(): bool
    {
        if (! $this->created_at) {
            return true;
        }

        return $this->created_at->diffInSeconds(now()) >= self::RESEND_COOLDOWN_SECONDS;
    }

    /**
     * Nombre de secondes restantes avant qu'un nouveau renvoi soit possible.
     */
    public function secondsBeforeResend(): int
    {
        if ($this->canResend()) {
            return 0;
        }

        return max(0, self::RESEND_COOLDOWN_SECONDS - $this->created_at->diffInSeconds(now()));
    }
}
