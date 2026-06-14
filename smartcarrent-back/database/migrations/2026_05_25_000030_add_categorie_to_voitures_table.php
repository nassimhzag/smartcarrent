<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Ajoute une categorie a chaque voiture (SUV, Berline, Citadine, Luxe,
     * Utilitaire). Nullable : les voitures existantes restent valides sans
     * categorie tant que l'admin ne l'a pas renseignee.
     */
    public function up(): void
    {
        Schema::table('voitures', function (Blueprint $table) {
            $table->string('categorie')->nullable()->after('image_path');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('voitures', function (Blueprint $table) {
            $table->dropColumn('categorie');
        });
    }
};
