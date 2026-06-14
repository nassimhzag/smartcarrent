<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Code de verification SmartCarRent</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            background: #f1f5f9;
            font-family: Helvetica, Arial, sans-serif;
            color: #0f172a;
        }
        .wrap {
            max-width: 560px;
            margin: 32px auto;
            background: #ffffff;
            border-radius: 14px;
            overflow: hidden;
            box-shadow: 0 10px 32px -18px rgba(15, 23, 42, 0.25);
        }
        .header {
            background: linear-gradient(135deg, #0d9488 0%, #115e59 100%);
            color: #ffffff;
            padding: 28px 32px 22px;
        }
        .brand {
            display: inline-block;
            background: rgba(255, 255, 255, 0.18);
            color: #ffffff;
            padding: 4px 12px;
            border-radius: 999px;
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 0.08em;
            text-transform: uppercase;
        }
        .header h1 {
            margin: 14px 0 4px;
            font-size: 22px;
            font-weight: 800;
        }
        .header p {
            margin: 0;
            opacity: 0.92;
            font-size: 14px;
        }
        .body {
            padding: 28px 32px 24px;
            line-height: 1.55;
            font-size: 14.5px;
        }
        .greeting {
            margin: 0 0 14px;
            font-size: 16px;
            font-weight: 700;
        }
        .code-box {
            margin: 22px auto;
            text-align: center;
            background: #f0fdfa;
            border: 1px solid rgba(20, 184, 166, 0.25);
            border-radius: 14px;
            padding: 22px 18px;
        }
        .code-label {
            margin: 0 0 8px;
            font-size: 11px;
            letter-spacing: 0.12em;
            font-weight: 700;
            text-transform: uppercase;
            color: #0f766e;
        }
        .code-value {
            font-size: 38px;
            font-weight: 800;
            letter-spacing: 12px;
            color: #0d9488;
            font-family: ui-monospace, "SF Mono", Consolas, monospace;
        }
        .ttl {
            margin: 14px 0 0;
            font-size: 12.5px;
            color: #475569;
        }
        .note {
            margin: 22px 0 0;
            padding: 14px 16px;
            background: #fffbeb;
            border-left: 3px solid #f59e0b;
            border-radius: 8px;
            font-size: 13px;
            color: #92400e;
        }
        .footer {
            padding: 18px 32px 24px;
            text-align: center;
            font-size: 12px;
            color: #64748b;
            border-top: 1px solid #e2e8f0;
        }
        .footer strong { color: #0d9488; }
    </style>
</head>
<body>
    <div class="wrap">
        <div class="header">
            <span class="brand">SmartCarRent</span>
            <h1>Verification de votre adresse email</h1>
            <p>Une derniere etape pour activer votre compte.</p>
        </div>

        <div class="body">
            <p class="greeting">Bonjour {{ $user->name }},</p>

            <p>
                Merci d'avoir cree un compte sur SmartCarRent. Pour finaliser votre inscription,
                veuillez saisir le code de verification ci-dessous sur la page d'activation :
            </p>

            <div class="code-box">
                <p class="code-label">Votre code</p>
                <div class="code-value">{{ $code }}</div>
                <p class="ttl">Ce code expire dans <strong>{{ $ttlMinutes }} minutes</strong>.</p>
            </div>

            <p>
                Si vous n'avez pas cree de compte sur SmartCarRent, vous pouvez ignorer cet email
                en toute securite : aucune autre action ne sera realisee sur votre adresse.
            </p>

            <div class="note">
                <strong>Securite :</strong> ne partagez jamais ce code. Notre equipe ne vous le
                demandera jamais par telephone ni par email.
            </div>
        </div>

        <div class="footer">
            <strong>SmartCarRent</strong> &middot; Avenue Habib Bourguiba, Tunis<br>
            contact@smartcarrent.tn &middot; +216 71 000 000
        </div>
    </div>
</body>
</html>
