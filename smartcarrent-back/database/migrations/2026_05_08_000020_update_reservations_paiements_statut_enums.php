<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Met à jour les enums :
     *  - reservations.statut : en_attente -> en_attente_paiement
     *  - paiements.statut    : valide -> paye, ajout de echoue
     */
    public function up(): void
    {
        // === RESERVATIONS ===
        // 1) Élargir l'enum pour accueillir la nouvelle valeur sans perdre les données
        DB::statement("ALTER TABLE reservations MODIFY statut ENUM('en_attente', 'en_attente_paiement', 'confirmee', 'annulee', 'terminee') NOT NULL DEFAULT 'en_attente_paiement'");

        // 2) Migrer les anciennes données
        DB::statement("UPDATE reservations SET statut = 'en_attente_paiement' WHERE statut = 'en_attente'");

        // 3) Resserrer l'enum sur la nouvelle liste
        DB::statement("ALTER TABLE reservations MODIFY statut ENUM('en_attente_paiement', 'confirmee', 'annulee', 'terminee') NOT NULL DEFAULT 'en_attente_paiement'");

        // === PAIEMENTS ===
        // 1) Élargir l'enum
        DB::statement("ALTER TABLE paiements MODIFY statut ENUM('en_attente', 'valide', 'paye', 'echoue', 'rembourse') NOT NULL DEFAULT 'en_attente'");

        // 2) Migrer les anciennes données
        DB::statement("UPDATE paiements SET statut = 'paye' WHERE statut = 'valide'");

        // 3) Resserrer l'enum
        DB::statement("ALTER TABLE paiements MODIFY statut ENUM('en_attente', 'paye', 'echoue', 'rembourse') NOT NULL DEFAULT 'en_attente'");
    }

    public function down(): void
    {
        // === PAIEMENTS rollback ===
        DB::statement("ALTER TABLE paiements MODIFY statut ENUM('en_attente', 'valide', 'paye', 'echoue', 'rembourse') NOT NULL DEFAULT 'en_attente'");
        DB::statement("UPDATE paiements SET statut = 'valide' WHERE statut = 'paye'");
        DB::statement("UPDATE paiements SET statut = 'en_attente' WHERE statut = 'echoue'");
        DB::statement("ALTER TABLE paiements MODIFY statut ENUM('en_attente', 'valide', 'rembourse') NOT NULL DEFAULT 'en_attente'");

        // === RESERVATIONS rollback ===
        DB::statement("ALTER TABLE reservations MODIFY statut ENUM('en_attente', 'en_attente_paiement', 'confirmee', 'annulee', 'terminee') NOT NULL DEFAULT 'en_attente'");
        DB::statement("UPDATE reservations SET statut = 'en_attente' WHERE statut = 'en_attente_paiement'");
        DB::statement("ALTER TABLE reservations MODIFY statut ENUM('en_attente', 'confirmee', 'annulee', 'terminee') NOT NULL DEFAULT 'en_attente'");
    }
};
