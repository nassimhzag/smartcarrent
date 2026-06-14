<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Nettoyage one-shot des reservations de demo incoherentes.
 *
 * STRATEGIE : on procede en 2 etapes pour contourner la limite MySQL 1093
 * ("can't specify target table for update in FROM clause") :
 *   etape 1 : SELECT des IDs concernes  -> tableau PHP
 *   etape 2 : UPDATE avec whereIn(tableau)  -> aucune sous-requete
 *
 * Aucun UPDATE de cette migration ne contient de sous-requete sur reservations.
 *
 * Cutoff : 30 jours dans le passe. Les resas recentes restent en_cours et
 * doivent etre traitees manuellement via le bandeau d'alerte du dashboard.
 */
return new class extends Migration
{
    public function up(): void
    {
        $cutoff = now()->subDays(30)->toDateString();
        $now = now();

        // ===== Etape 1 : SELECT des IDs (3 requetes independantes) =====

        // 1.A) Resas anciennes + paiement paye -> destinees a terminee
        $idsToClose = collect(
            DB::select(
                'SELECT r.id FROM reservations r '
                . 'INNER JOIN paiements p ON p.reservation_id = r.id '
                . "WHERE r.statut = 'en_cours' AND p.statut = 'paye' "
                . 'AND DATE(r.date_fin) < ?',
                [$cutoff]
            )
        )->pluck('id')->all();

        // 1.B) Resas anciennes + paiement en_attente -> destinees a annulee
        $idsToCancelPending = collect(
            DB::select(
                'SELECT r.id FROM reservations r '
                . 'INNER JOIN paiements p ON p.reservation_id = r.id '
                . "WHERE r.statut = 'en_cours' AND p.statut = 'en_attente' "
                . 'AND DATE(r.date_fin) < ?',
                [$cutoff]
            )
        )->pluck('id')->all();

        // 1.C) Resas anciennes sans paiement du tout -> destinees a annulee
        $idsToCancelOrphan = collect(
            DB::select(
                'SELECT r.id FROM reservations r '
                . 'LEFT JOIN paiements p ON p.reservation_id = r.id '
                . "WHERE r.statut = 'en_cours' AND p.id IS NULL "
                . 'AND DATE(r.date_fin) < ?',
                [$cutoff]
            )
        )->pluck('id')->all();

        // ===== Etape 2 : UPDATE simples sur whereIn(tableau) =====

        $closed = 0;
        if (! empty($idsToClose)) {
            $closed = DB::table('reservations')
                ->whereIn('id', $idsToClose)
                ->update(['statut' => 'terminee', 'updated_at' => $now]);
        }

        $cancelledPending = 0;
        if (! empty($idsToCancelPending)) {
            $cancelledPending = DB::table('reservations')
                ->whereIn('id', $idsToCancelPending)
                ->update(['statut' => 'annulee', 'updated_at' => $now]);
        }

        $cancelledOrphan = 0;
        if (! empty($idsToCancelOrphan)) {
            $cancelledOrphan = DB::table('reservations')
                ->whereIn('id', $idsToCancelOrphan)
                ->update(['statut' => 'annulee', 'updated_at' => $now]);
        }

        // Log resultat (consultable dans storage/logs/laravel.log)
        $total = $closed + $cancelledPending + $cancelledOrphan;
        if ($total > 0) {
            error_log(sprintf(
                '[cleanup_demo_reservations] %d terminees, %d annulees (orphelines: %d). Cutoff: %s',
                $closed,
                $cancelledPending + $cancelledOrphan,
                $cancelledOrphan,
                $cutoff
            ));
        }
    }

    public function down(): void
    {
        // Migration de nettoyage de donnees : pas de rollback.
    }
};
