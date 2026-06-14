<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Simplifie l'enum reservations.statut en passant de 4 a 3 valeurs :
 *   - en_attente_paiement + confirmee  ->  en_cours
 *   - annulee                          ->  annulee (inchange)
 *   - terminee                         ->  terminee (inchange)
 *
 * Rationale : la dimension financiere (paye / en_attente / rembourse) est
 * desormais portee uniquement par la table paiements. La table reservations
 * porte uniquement le cycle de vie : en_cours -> terminee ou annulee.
 */
return new class extends Migration
{
    public function up(): void
    {
        // 1) Elargir l'enum pour accueillir la nouvelle valeur sans perdre les donnees.
        DB::statement("ALTER TABLE reservations MODIFY statut ENUM('en_attente_paiement', 'confirmee', 'annulee', 'terminee', 'en_cours') NOT NULL DEFAULT 'en_attente_paiement'");

        // 2) Migrer les anciennes valeurs vers en_cours.
        DB::statement("UPDATE reservations SET statut = 'en_cours' WHERE statut IN ('en_attente_paiement', 'confirmee')");

        // 3) Resserrer l'enum sur la nouvelle liste a 3 valeurs.
        DB::statement("ALTER TABLE reservations MODIFY statut ENUM('en_cours', 'terminee', 'annulee') NOT NULL DEFAULT 'en_cours'");
    }

    public function down(): void
    {
        // Rollback : on remet l'enum d'origine. Les en_cours partent en
        // en_attente_paiement par defaut (on n'a plus l'info financiere pour
        // les redistribuer, c'est ok comme valeur de repli).
        DB::statement("ALTER TABLE reservations MODIFY statut ENUM('en_attente_paiement', 'confirmee', 'annulee', 'terminee', 'en_cours') NOT NULL DEFAULT 'en_cours'");
        DB::statement("UPDATE reservations SET statut = 'en_attente_paiement' WHERE statut = 'en_cours'");
        DB::statement("ALTER TABLE reservations MODIFY statut ENUM('en_attente_paiement', 'confirmee', 'annulee', 'terminee') NOT NULL DEFAULT 'en_attente_paiement'");
    }
};
