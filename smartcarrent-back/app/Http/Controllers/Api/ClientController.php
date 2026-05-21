<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\ClientStoreRequest;
use App\Http\Requests\Api\ClientUpdateRequest;
use App\Models\Client;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ClientController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $perPage = min(max((int) $request->query('per_page', 10), 1), 100);

        return response()->json(
            Client::with('utilisateur')
                ->withCount('reservations')
                ->latest()
                ->paginate($perPage)
                ->appends($request->query())
        );
    }

    public function store(ClientStoreRequest $request): JsonResponse
    {
        $data = $request->validated();

        $client = Client::create($data);

        return response()->json($client->load('utilisateur'), 201);
    }

    public function show(Client $client): JsonResponse
    {
        $client->load([
            'utilisateur',
            'reservations' => function ($query) {
                $query->latest('date_debut');
            },
            'reservations.voiture.marque',
            'reservations.paiement',
            'predictions',
            'recommendations',
        ]);

        return response()->json($client);
    }

    public function update(ClientUpdateRequest $request, Client $client): JsonResponse
    {
        $data = $request->validated();

        $client->update($data);

        return response()->json($client->load('utilisateur'));
    }

    public function destroy(Client $client): JsonResponse
    {
        $client->delete();

        return response()->json(null, 204);
    }
}
