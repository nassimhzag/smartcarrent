<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('users')
            ->where('role', 'client')
            ->update(['role' => 'utilisateur']);
    }

    public function down(): void
    {
        DB::table('users')
            ->where('role', 'utilisateur')
            ->update(['role' => 'client']);
    }
};
