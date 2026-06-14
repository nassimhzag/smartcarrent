<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Reservation;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Symfony\Component\HttpFoundation\Response;

class FactureController extends Controller
{
    /**
     * Telecharge la facture PDF d'une reservation.
     *
     * Acces :
     *  - l'utilisateur proprietaire de la reservation (via son profil client)
     *  - ou un admin
     *
     * Eligibilite :
     *  - paiement associe avec statut 'paye'
     *  - ou reservation terminee (invariant : forcement payee)
     */
    public function download(Request $request, Reservation $reservation): Response
    {
        $user = $request->user();
        abort_unless($user, 401, 'Authentification requise.');

        $isAdmin = method_exists($user, 'isAdmin') ? $user->isAdmin() : ($user->role ?? null) === 'admin';

        if (! $isAdmin) {
            abort_if(! $user->client, 403, 'Profil client introuvable.');
            abort_if(
                (int) $reservation->client_id !== (int) $user->client->id,
                403,
                'Action non autorisee.'
            );
        }

        $reservation->load([
            'client.utilisateur',
            'voiture.marque',
            'paiement',
        ]);

        if (! $this->isFactureAvailable($reservation)) {
            abort(409, 'Aucune facture disponible : la reservation doit etre confirmee ou le paiement valide.');
        }

        $data = $this->buildFactureData($reservation);

        $pdf = Pdf::loadView('factures.reservation', $data)
            ->setPaper('a4', 'portrait');

        $filename = 'facture-' . $data['numero'] . '.pdf';

        return $pdf->download($filename);
    }

    /**
     * Une facture est disponible des qu'un paiement est encaisse.
     * Une reservation terminee a forcement ete payee (invariant metier).
     */
    private function isFactureAvailable(Reservation $reservation): bool
    {
        if ($reservation->statut === 'terminee') {
            return true;
        }

        return optional($reservation->paiement)->statut === 'paye';
    }

    /**
     * Prepare les donnees a injecter dans la vue Blade.
     */
    private function buildFactureData(Reservation $reservation): array
    {
        $voiture = $reservation->voiture;
        $marque = $voiture?->marque;
        $client = $reservation->client;
        $utilisateur = $client?->utilisateur;
        $paiement = $reservation->paiement;

        $debut = $reservation->date_debut ? Carbon::parse($reservation->date_debut) : null;
        $fin = $reservation->date_fin ? Carbon::parse($reservation->date_fin) : null;
        $jours = ($debut && $fin) ? max($debut->diffInDays($fin) + 1, 1) : 0;

        $prixJour = (float) ($voiture?->prix_par_jour ?? 0);
        $montantPaye = $paiement?->montant !== null ? (float) $paiement->montant : null;
        $total = $montantPaye ?? round($jours * $prixJour, 2);

        $numero = sprintf(
            'FAC-%s-%06d',
            ($debut ?? $reservation->created_at ?? now())->format('Y'),
            $reservation->id
        );

        return [
            'numero' => $numero,
            'dateGeneration' => now(),
            'reservation' => $reservation,
            'client' => $client,
            'utilisateur' => $utilisateur,
            'voiture' => $voiture,
            'marque' => $marque,
            'paiement' => $paiement,
            'debut' => $debut,
            'fin' => $fin,
            'jours' => $jours,
            'prixJour' => $prixJour,
            'total' => $total,
        ];
    }
}
