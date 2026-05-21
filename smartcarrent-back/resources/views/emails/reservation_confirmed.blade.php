<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Reservation confirmee</title>
</head>
<body style="margin:0;padding:0;font-family:Arial,Helvetica,sans-serif;background:#f8fafc;color:#0f172a;">
    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#f8fafc;padding:24px 12px;">
        <tr>
            <td align="center">
                <table cellpadding="0" cellspacing="0" border="0" width="600" style="max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">
                    <tr>
                        <td style="background:linear-gradient(135deg,#0d9488,#0f766e);color:#ffffff;padding:24px 28px;">
                            <p style="margin:0;font-size:12px;letter-spacing:0.16em;text-transform:uppercase;opacity:0.85;">SmartCarRent</p>
                            <h1 style="margin:6px 0 0;font-size:22px;font-weight:700;">Reservation confirmee</h1>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:28px;">
                            <p style="margin:0 0 16px;font-size:15px;line-height:1.6;">
                                Bonjour <strong>{{ $clientName }}</strong>,
                            </p>
                            <p style="margin:0 0 16px;font-size:15px;line-height:1.6;">
                                Votre reservation <strong>{{ $reference }}</strong> est confirmee. Voici le recapitulatif :
                            </p>

                            <table cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;margin:18px 0;">
                                <tr>
                                    <td style="padding:10px 12px;background:#f1f5f9;border-radius:8px 0 0 0;font-size:13px;color:#64748b;">Vehicule</td>
                                    <td style="padding:10px 12px;background:#ffffff;border-bottom:1px solid #e2e8f0;font-size:14px;font-weight:600;">{{ $voitureLabel }}</td>
                                </tr>
                                <tr>
                                    <td style="padding:10px 12px;background:#f1f5f9;font-size:13px;color:#64748b;">Immatriculation</td>
                                    <td style="padding:10px 12px;background:#ffffff;border-bottom:1px solid #e2e8f0;font-size:14px;">{{ $immatriculation }}</td>
                                </tr>
                                <tr>
                                    <td style="padding:10px 12px;background:#f1f5f9;font-size:13px;color:#64748b;">Date debut</td>
                                    <td style="padding:10px 12px;background:#ffffff;border-bottom:1px solid #e2e8f0;font-size:14px;">{{ $dateDebut }}</td>
                                </tr>
                                <tr>
                                    <td style="padding:10px 12px;background:#f1f5f9;font-size:13px;color:#64748b;">Date fin</td>
                                    <td style="padding:10px 12px;background:#ffffff;border-bottom:1px solid #e2e8f0;font-size:14px;">{{ $dateFin }}</td>
                                </tr>
                                <tr>
                                    <td style="padding:10px 12px;background:#f1f5f9;font-size:13px;color:#64748b;">Duree</td>
                                    <td style="padding:10px 12px;background:#ffffff;border-bottom:1px solid #e2e8f0;font-size:14px;">{{ $jours }} jour{{ $jours > 1 ? 's' : '' }}</td>
                                </tr>
                                <tr>
                                    <td style="padding:10px 12px;background:#f1f5f9;font-size:13px;color:#64748b;">Methode</td>
                                    <td style="padding:10px 12px;background:#ffffff;border-bottom:1px solid #e2e8f0;font-size:14px;">{{ $modePaiement }}</td>
                                </tr>
                                <tr>
                                    <td style="padding:14px 12px;background:#ecfdf5;border-radius:0 0 0 8px;font-size:13px;color:#115e59;font-weight:700;">Montant total</td>
                                    <td style="padding:14px 12px;background:#ecfdf5;font-size:18px;font-weight:800;color:#0f766e;">{{ number_format($montant, 2, '.', ' ') }} DT</td>
                                </tr>
                            </table>

                            <p style="margin:18px 0 0;font-size:13px;color:#64748b;line-height:1.6;">
                                Pensez a vous munir d'une piece d'identite et de votre permis de conduire (valide depuis au moins 2 ans) lors du retrait du vehicule.
                            </p>

                            <p style="margin:18px 0 0;font-size:13px;color:#64748b;line-height:1.6;">
                                Merci de votre confiance,<br>
                                <strong style="color:#0f766e;">L'equipe SmartCarRent</strong>
                            </p>
                        </td>
                    </tr>
                    <tr>
                        <td style="background:#f8fafc;color:#94a3b8;font-size:11px;text-align:center;padding:14px;">
                            Cet email a ete envoye automatiquement, merci de ne pas y repondre.
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
