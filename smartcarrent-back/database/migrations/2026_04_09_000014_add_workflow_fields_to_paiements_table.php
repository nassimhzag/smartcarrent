<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('paiements', function (Blueprint $table) {
            $table->enum('statut', ['en_attente', 'valide', 'rembourse'])->default('en_attente')->after('mode_paiement');
            $table->timestamp('date_validation')->nullable()->after('statut');
            $table->timestamp('date_remboursement')->nullable()->after('date_validation');
        });
    }

    public function down(): void
    {
        Schema::table('paiements', function (Blueprint $table) {
            $table->dropColumn(['statut', 'date_validation', 'date_remboursement']);
        });
    }
};
