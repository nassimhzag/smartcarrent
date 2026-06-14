<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Cree la table email_otps qui stocke le code de verification a 6 chiffres
     * envoye par email apres l'inscription. Un seul OTP actif par utilisateur :
     * lorsqu'un nouveau code est genere, l'ancien est supprime.
     *
     * Au passage, on "grandfather" les comptes existants en mettant
     * email_verified_at = now() pour qu'ils continuent de pouvoir se connecter
     * sans avoir a verifier leur email (la regle ne s'applique qu'aux nouveaux
     * comptes crees apres la mise en production de cette fonctionnalite).
     */
    public function up(): void
    {
        Schema::create('email_otps', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')
                ->constrained('users')
                ->cascadeOnDelete();
            $table->string('code', 6);
            $table->timestamp('expires_at');
            $table->unsignedInteger('attempts')->default(0);
            $table->timestamps();

            $table->index(['user_id', 'expires_at']);
        });

        // Grandfather : on considere les utilisateurs deja inscrits comme verifies.
        DB::table('users')
            ->whereNull('email_verified_at')
            ->update(['email_verified_at' => now()]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('email_otps');
    }
};
