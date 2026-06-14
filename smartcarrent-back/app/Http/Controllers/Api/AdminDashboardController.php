<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Client;
use App\Models\Paiement;
use App\Models\Reservation;
use App\Models\Voiture;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

/**
 * Endpoint d'agregation pour le tableau de bord administrateur.
 *
 * Une seule requete GET /api/admin/dashboard/stats renvoie l'ensemble
 * des donnees necessaires aux KPI cards et aux 4 graphiques recharts.
 * Toutes les agregations sont faites en SQL pour rester performantes
 * meme avec un gros volume.
 */
class AdminDashboardController extends Controller
{
    public function stats(Request $request): JsonResponse
    {
        abort_unless($request->user() && $request->user()->isAdmin(), 403);

        return response()->json([
            'summary' => $this->summary(),
            'revenue_monthly' => $this->revenueMonthly(),
            'top_voitures' => $this->topVoitures(),
            'status_breakdown' => $this->statusBreakdown(),
            'reservations_daily' => $this->reservationsDaily(),
        ]);
    }

    /* ============================================================
     |  KPI summary
     |
     |  Apres simplification des statuts reservation (en_cours / terminee /
     |  annulee), les KPI 'pending' et 'confirmed' sont desormais derives du
     |  PAIEMENT, pas du statut de la reservation. La logique :
     |    - pending_reservations = resa 'en_cours' dont le paiement est encore
     |      en attente (= a relancer)
     |    - confirmed_reservations = resa 'en_cours' dont le paiement est paye
     |      (= prete a partir / en cours d'utilisation)
     ============================================================ */
    private function summary(): array
    {
        $pendingPayment = Reservation::query()
            ->where('statut', 'en_cours')
            ->whereHas('paiement', fn ($q) => $q->where('statut', 'en_attente'))
            ->count();

        $confirmedPaid = Reservation::query()
            ->where('statut', 'en_cours')
            ->whereHas('paiement', fn ($q) => $q->where('statut', 'paye'))
            ->count();

        return [
            'total_revenue' => (float) Paiement::where('statut', 'paye')->sum('montant'),
            'total_reservations' => Reservation::count(),
            'total_voitures' => Voiture::count(),
            'total_clients' => Client::count(),
            'paid_paiements' => Paiement::where('statut', 'paye')->count(),
            'pending_reservations' => $pendingPayment,
            'confirmed_reservations' => $confirmedPaid,
            'refunded_amount' => (float) Paiement::where('statut', 'rembourse')->sum('montant'),
        ];
    }

    /* ============================================================
     |  Revenu mensuel : 6 derniers mois (paiements payes)
     ============================================================ */
    private function revenueMonthly(): array
    {
        $start = Carbon::now()->subMonths(5)->startOfMonth();

        $rows = Paiement::query()
            ->where('statut', 'paye')
            ->where('date_paiement', '>=', $start->toDateString())
            ->selectRaw("DATE_FORMAT(date_paiement, '%Y-%m') as ym, SUM(montant) as revenue")
            ->groupBy('ym')
            ->orderBy('ym')
            ->get()
            ->keyBy('ym');

        // On normalise pour avoir TOUS les 6 derniers mois meme s'ils sont a 0.
        $result = [];
        for ($i = 0; $i < 6; $i++) {
            $ym = $start->copy()->addMonths($i)->format('Y-m');
            $label = $start->copy()->addMonths($i)->locale('fr')->isoFormat('MMM YY');
            $result[] = [
                'month' => $ym,
                'label' => ucfirst($label),
                'revenue' => isset($rows[$ym]) ? round((float) $rows[$ym]->revenue, 2) : 0,
            ];
        }

        return $result;
    }

    /* ============================================================
     |  Top 5 voitures les plus reservees
     ============================================================ */
    private function topVoitures(): array
    {
        $voitures = Voiture::query()
            ->with('marque:id,nom')
            ->withCount(['reservations as bookings_count' => function ($q): void {
                $q->whereIn('statut', ['en_cours', 'terminee']);
            }])
            ->having('bookings_count', '>', 0)
            ->orderByDesc('bookings_count')
            ->take(5)
            ->get();

        return $voitures->map(function (Voiture $v) {
            $label = trim(($v->marque?->nom ?? '') . ' ' . ($v->modele ?? ''));
            return [
                'id' => $v->id,
                'label' => $label !== '' ? $label : ('Voiture #' . $v->id),
                'count' => (int) ($v->bookings_count ?? 0),
            ];
        })->toArray();
    }

    /* ============================================================
     |  Repartition des statuts de reservation
     ============================================================ */
    private function statusBreakdown(): array
    {
        $rows = Reservation::query()
            ->selectRaw('statut, COUNT(*) as count')
            ->groupBy('statut')
            ->get()
            ->keyBy('statut');

        $labels = [
            'en_cours' => 'En cours',
            'terminee' => 'Terminees',
            'annulee'  => 'Annulees',
        ];

        $result = [];
        foreach ($labels as $key => $label) {
            $result[] = [
                'key' => $key,
                'label' => $label,
                'count' => isset($rows[$key]) ? (int) $rows[$key]->count : 0,
            ];
        }

        return $result;
    }

    /* ============================================================
     |  Reservations creees jour par jour (14 derniers jours)
     ============================================================ */
    private function reservationsDaily(): array
    {
        $start = Carbon::now()->subDays(13)->startOfDay();

        $rows = Reservation::query()
            ->where('created_at', '>=', $start)
            ->selectRaw('DATE(created_at) as d, COUNT(*) as count')
            ->groupBy('d')
            ->orderBy('d')
            ->get()
            ->keyBy('d');

        $result = [];
        for ($i = 0; $i < 14; $i++) {
            $day = $start->copy()->addDays($i);
            $key = $day->toDateString();
            $result[] = [
                'date' => $key,
                'label' => $day->locale('fr')->isoFormat('DD MMM'),
                'count' => isset($rows[$key]) ? (int) $rows[$key]->count : 0,
            ];
        }

        return $result;
    }
}
