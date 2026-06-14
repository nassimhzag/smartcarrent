<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Supprime la valeur 'echoue' de l'enum paiements.statut.
 * Les paiements existants ayant ce statut sont migres vers 'rembourse',
 * ce qui correspond a leur reservation annulee. Apres execution, les
 * statuts autorises sont uniquement : en_attente, paye, rembourse.
 */
return new class extends Migration
{
    public function up(): void
    {
        // 1) Migrer les lignes existantes 'echoue' -> 'rembourse'.
        DB::statement("UPDATE paiements SET statut = 'rembourse' WHERE statut = 'echoue'");

        // 2) Resserrer l'enum sur les 3 statuts finaux.
        DB::statement("ALTER TABLE paiements MODIFY statut ENUM('en_attente', 'paye', 'rembourse') NOT NULL DEFAULT 'en_attente'");
    }

    public function down(): void
    {
        // Rollback : remettre 'echoue' dans la liste autorisee.
        DB::statement("ALTER TABLE paiements MODIFY statut ENUM('en_attente', 'paye', 'echoue', 'rembourse') NOT NULL DEFAULT 'en_attente'");
    }
};
