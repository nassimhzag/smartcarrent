<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Simplifie l'enum paiements.statut a 2 valeurs : paye, rembourse.
 *
 * Contexte metier : suppression du statut intermediaire 'en_attente'. Tous
 * les paiements sont desormais directement marques 'paye' lors de leur
 * creation, quel que soit le mode (carte, virement, mobile_money, especes).
 *
 * Migration des donnees existantes :
 *   - en_attente -> paye (avec date_validation = created_at si NULL)
 *   - paye      -> inchange
 *   - rembourse -> inchange
 */
return new class extends Migration
{
    public function up(): void
    {
        // 1) Elargir l'enum pour accueillir la transition.
        DB::statement("ALTER TABLE paiements MODIFY statut ENUM('en_attente', 'paye', 'rembourse') NOT NULL DEFAULT 'paye'");

        // 2) Migrer les lignes existantes en_attente -> paye, avec date_validation
        //    forcee a created_at quand elle est nulle (coherence : un paiement
        //    paye doit avoir une date de validation).
        DB::statement('UPDATE paiements SET date_validation = COALESCE(date_validation, created_at) WHERE statut = "en_attente"');
        DB::statement("UPDATE paiements SET statut = 'paye' WHERE statut = 'en_attente'");

        // 3) Resserrer l'enum sur les 2 statuts finaux.
        DB::statement("ALTER TABLE paiements MODIFY statut ENUM('paye', 'rembourse') NOT NULL DEFAULT 'paye'");
    }

    public function down(): void
    {
        // Rollback : remettre l'ancien enum a 3 valeurs.
        DB::statement("ALTER TABLE paiements MODIFY statut ENUM('en_attente', 'paye', 'rembourse') NOT NULL DEFAULT 'en_attente'");
    }
};
