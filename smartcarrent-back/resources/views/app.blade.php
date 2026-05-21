<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>SmartCarRent</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;600;700;800&family=Sora:wght@500;600;700&display=swap" rel="stylesheet">
    @php
        $frontendBuildDir = public_path('frontend');
        $manifestPath = $frontendBuildDir . '/asset-manifest.json';
        $hasFrontendBuild = file_exists($manifestPath);
        $manifest = $hasFrontendBuild ? json_decode(file_get_contents($manifestPath), true) : null;
    @endphp

    @if($hasFrontendBuild && isset($manifest['entrypoints']))
        @foreach($manifest['entrypoints'] as $entry)
            @if(\Illuminate\Support\Str::endsWith($entry, '.css'))
                <link rel="stylesheet" href="{{ url('frontend/' . ltrim($entry, '/')) }}">
            @endif
        @endforeach
    @else
        @viteReactRefresh
        @vite(['resources/css/app.css', 'resources/js/app.js'])
    @endif
</head>
<body class="min-h-screen bg-slate-100">
    <div id="root"></div>
    @if($hasFrontendBuild && isset($manifest['entrypoints']))
        @foreach($manifest['entrypoints'] as $entry)
            @if(\Illuminate\Support\Str::endsWith($entry, '.js'))
                <script src="{{ url('frontend/' . ltrim($entry, '/')) }}" defer></script>
            @endif
        @endforeach
    @endif
</body>
</html>
