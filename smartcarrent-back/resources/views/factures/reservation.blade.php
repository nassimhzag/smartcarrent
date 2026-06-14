@php
    function fact_mode_paiement($mode) {
        return match ($mode) {
            'carte' => 'Carte bancaire',
            'virement' => 'Virement bancaire',
            'especes' => 'Paiement sur place (especes)',
            'mobile_money' => 'Mobile money',
            default => $mode ?: '—',
        };
    }

    function fact_statut_paiement($statut) {
        return match ($statut) {
            'paye' => 'Paye',
            'en_attente' => 'En attente',
            'rembourse' => 'Rembourse',
            default => $statut ?: '—',
        };
    }

    function fact_statut_reservation($statut) {
        return match ($statut) {
            'en_cours' => 'En cours',
            'annulee' => 'Annulee',
            'terminee' => 'Terminee',
            // Anciens libelles conserves pour les factures historiques.
            'en_attente_paiement' => 'En attente de paiement',
            'confirmee' => 'Confirmee',
            default => $statut ?: '—',
        };
    }

    function fact_date($value) {
        if (! $value) return '—';
        try {
            return \Illuminate\Support\Carbon::parse($value)->locale('fr')->isoFormat('DD MMMM YYYY');
        } catch (\Throwable $e) {
            return (string) $value;
        }
    }
@endphp
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Facture {{ $numero }}</title>
    <style>
        @page { margin: 36px 40px; }
        body {
            font-family: Helvetica, Arial, sans-serif;
            color: #0f172a;
            font-size: 11.5px;
            line-height: 1.45;
            margin: 0;
            padding: 0;
        }

        /* --- En-tete --- */
        .header { width: 100%; border-collapse: collapse; margin-bottom: 26px; }
        .header td { vertical-align: top; }
        .brand { width: 60%; }
        .brand-row { font-size: 0; }
        .brand-mark {
            display: inline-block;
            width: 44px;
            height: 44px;
            background: #0d9488;
            border-radius: 10px;
            color: #ffffff;
            text-align: center;
            line-height: 44px;
            font-size: 16px;
            font-weight: bold;
            letter-spacing: 1px;
            vertical-align: middle;
        }
        .brand-text {
            display: inline-block;
            margin-left: 12px;
            vertical-align: middle;
            font-size: 18px;
            font-weight: bold;
            color: #0f172a;
        }
        .brand-text .accent { color: #0d9488; }
        .brand-tagline { font-size: 10px; color: #64748b; margin-top: 6px; }
        .invoice-meta { width: 40%; text-align: right; }
        .invoice-meta .label { font-size: 9.5px; color: #64748b; text-transform: uppercase; letter-spacing: 0.6px; }
        .invoice-meta .value { font-size: 14px; font-weight: bold; color: #0f172a; margin-bottom: 8px; }
        .invoice-meta .small { font-size: 10px; color: #475569; }

        /* --- Bandeau facture --- */
        .title-bar {
            background: #0d9488;
            color: #ffffff;
            padding: 10px 16px;
            border-radius: 6px;
            margin-bottom: 22px;
        }
        .title-bar .title { font-size: 16px; font-weight: bold; letter-spacing: 0.4px; }
        .title-bar .subtitle { font-size: 10px; opacity: 0.9; margin-top: 2px; }

        /* --- Sections --- */
        .section { margin-bottom: 18px; page-break-inside: avoid; }
        .section-title {
            font-size: 11px;
            font-weight: bold;
            color: #0d9488;
            text-transform: uppercase;
            letter-spacing: 0.6px;
            border-bottom: 1px solid #e2e8f0;
            padding-bottom: 4px;
            margin-bottom: 8px;
        }
        .kv { width: 100%; border-collapse: collapse; }
        .kv td { padding: 4px 0; font-size: 11px; vertical-align: top; }
        .kv td.k { color: #64748b; width: 38%; }
        .kv td.v { color: #0f172a; font-weight: bold; }

        /* --- Tableau facturation --- */
        .invoice-table { width: 100%; border-collapse: collapse; margin-top: 6px; }
        .invoice-table th {
            background: #f1f5f9;
            color: #475569;
            text-align: left;
            font-size: 10px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 0.4px;
            padding: 8px 10px;
            border-bottom: 1px solid #e2e8f0;
        }
        .invoice-table td {
            padding: 10px;
            border-bottom: 1px solid #e2e8f0;
            color: #0f172a;
        }
        .invoice-table .num { text-align: right; }
        .invoice-table tfoot td {
            border-bottom: none;
            font-weight: bold;
            font-size: 12px;
            padding-top: 12px;
        }
        .invoice-table tfoot .total {
            background: #ecfdf5;
            color: #0d9488;
            font-size: 15px;
            padding: 12px 10px;
            border-top: 2px solid #0d9488;
        }

        /* --- Badge statut --- */
        .badge {
            display: inline-block;
            padding: 3px 10px;
            border-radius: 999px;
            font-size: 10px;
            font-weight: bold;
            letter-spacing: 0.3px;
        }
        .badge-ok { background: #dcfce7; color: #166534; }
        .badge-warn { background: #fef3c7; color: #92400e; }
        .badge-info { background: #dbeafe; color: #1e40af; }
        .badge-muted { background: #f1f5f9; color: #475569; }

        /* --- Footer --- */
        .footer {
            margin-top: 28px;
            padding-top: 14px;
            border-top: 1px solid #e2e8f0;
            text-align: center;
            color: #64748b;
            font-size: 10.5px;
        }
        .footer .thanks { color: #0d9488; font-weight: bold; font-size: 12px; margin-bottom: 4px; }

        /* --- Layout 2 colonnes via tableau (dompdf-friendly) --- */
        .two-col { width: 100%; border-collapse: separate; border-spacing: 14px 0; }
        .two-col > tbody > tr > td { width: 50%; vertical-align: top; padding: 0; }
    </style>
</head>
<body>

    {{-- En-tete : logo + numero facture --}}
    <table class="header">
        <tr>
            <td class="brand">
                <div class="brand-row">
                    <span class="brand-mark">SC</span>
                    <span class="brand-text">Smart<span class="accent">CarRent</span></span>
                </div>
                <div class="brand-tagline">
                    Agence de location de vehicules<br>
                    Avenue Habib Bourguiba, Tunis &middot; +216 71 000 000
                </div>
            </td>
            <td class="invoice-meta">
                <div class="label">Numero de facture</div>
                <div class="value">{{ $numero }}</div>
                <div class="label">Date d'emission</div>
                <div class="small">{{ \Illuminate\Support\Carbon::parse($dateGeneration)->locale('fr')->isoFormat('DD MMMM YYYY [a] HH:mm') }}</div>
            </td>
        </tr>
    </table>

    <div class="title-bar">
        <div class="title">FACTURE</div>
        <div class="subtitle">Reservation #{{ $reservation->id }} &middot; {{ fact_statut_reservation($reservation->statut) }}</div>
    </div>

    {{-- Client + Vehicule cote a cote --}}
    <table class="two-col">
        <tr>
            <td>
                <div class="section">
                    <div class="section-title">Client</div>
                    <table class="kv">
                        <tr><td class="k">Nom</td><td class="v">{{ $utilisateur?->name ?? '—' }}</td></tr>
                        <tr><td class="k">Email</td><td class="v">{{ $utilisateur?->email ?? '—' }}</td></tr>
                        <tr><td class="k">Telephone</td><td class="v">{{ $client?->telephone ?? '—' }}</td></tr>
                        @if ($client?->permis_conduire)
                            <tr><td class="k">Permis</td><td class="v">{{ $client->permis_conduire }}</td></tr>
                        @endif
                    </table>
                </div>
            </td>
            <td>
                <div class="section">
                    <div class="section-title">Vehicule</div>
                    <table class="kv">
                        <tr>
                            <td class="k">Marque / Modele</td>
                            <td class="v">
                                {{ $marque?->nom ?? 'Sans marque' }} &mdash; {{ $voiture?->modele ?? '—' }}
                            </td>
                        </tr>
                        @if ($voiture?->immatriculation)
                            <tr><td class="k">Immatriculation</td><td class="v">{{ $voiture->immatriculation }}</td></tr>
                        @endif
                        @if ($voiture?->annee)
                            <tr><td class="k">Annee</td><td class="v">{{ $voiture->annee }}</td></tr>
                        @endif
                        @if ($voiture?->categorie)
                            <tr><td class="k">Categorie</td><td class="v">{{ $voiture->categorie }}</td></tr>
                        @endif
                    </table>
                </div>
            </td>
        </tr>
    </table>

    {{-- Reservation : dates / duree / facturation --}}
    <div class="section">
        <div class="section-title">Reservation</div>
        <table class="kv" style="margin-bottom: 8px;">
            <tr>
                <td class="k">Reference</td>
                <td class="v">RES-{{ str_pad($reservation->id, 6, '0', STR_PAD_LEFT) }}</td>
            </tr>
            <tr>
                <td class="k">Periode</td>
                <td class="v">{{ fact_date($debut) }} &mdash; {{ fact_date($fin) }}</td>
            </tr>
            <tr>
                <td class="k">Duree</td>
                <td class="v">{{ $jours }} jour{{ $jours > 1 ? 's' : '' }}</td>
            </tr>
        </table>

        <table class="invoice-table">
            <thead>
                <tr>
                    <th>Designation</th>
                    <th class="num">Quantite</th>
                    <th class="num">Prix unitaire</th>
                    <th class="num">Montant</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>
                        Location {{ $marque?->nom ?? '' }} {{ $voiture?->modele ?? '' }}
                        @if ($debut && $fin)
                            <br><span style="color: #64748b; font-size: 10px;">Du {{ fact_date($debut) }} au {{ fact_date($fin) }}</span>
                        @endif
                    </td>
                    <td class="num">{{ $jours }}</td>
                    <td class="num">{{ number_format($prixJour, 2, ',', ' ') }} DT</td>
                    <td class="num">{{ number_format($jours * $prixJour, 2, ',', ' ') }} DT</td>
                </tr>
            </tbody>
            <tfoot>
                <tr>
                    <td colspan="3" class="num total">Total a regler</td>
                    <td class="num total">{{ number_format($total, 2, ',', ' ') }} DT</td>
                </tr>
            </tfoot>
        </table>
    </div>

    {{-- Paiement --}}
    <div class="section">
        <div class="section-title">Paiement</div>
        @if ($paiement)
            <table class="kv">
                <tr>
                    <td class="k">Mode de paiement</td>
                    <td class="v">{{ fact_mode_paiement($paiement->mode_paiement) }}</td>
                </tr>
                <tr>
                    <td class="k">Statut</td>
                    <td class="v">
                        @php
                            $bclass = match($paiement->statut) {
                                'paye' => 'badge-ok',
                                'en_attente' => 'badge-warn',
                                'rembourse' => 'badge-info',
                                default => 'badge-muted',
                            };
                        @endphp
                        <span class="badge {{ $bclass }}">{{ fact_statut_paiement($paiement->statut) }}</span>
                    </td>
                </tr>
                <tr>
                    <td class="k">Date du paiement</td>
                    <td class="v">{{ fact_date($paiement->date_paiement) }}</td>
                </tr>
                @if ($paiement->date_validation)
                    <tr>
                        <td class="k">Validation</td>
                        <td class="v">{{ fact_date($paiement->date_validation) }}</td>
                    </tr>
                @endif
                <tr>
                    <td class="k">Montant</td>
                    <td class="v">{{ number_format((float) $paiement->montant, 2, ',', ' ') }} DT</td>
                </tr>
            </table>
        @else
            <p style="color: #64748b; font-size: 11px; margin: 0;">
                Aucun paiement enregistre pour le moment.
            </p>
        @endif
    </div>

    {{-- Pied de page --}}
    <div class="footer">
        <div class="thanks">Merci pour votre confiance.</div>
        <div>
            SmartCarRent &middot; contact@smartcarrent.tn &middot; +216 71 000 000
        </div>
    </div>

</body>
</html>
