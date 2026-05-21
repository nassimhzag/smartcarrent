<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\RecommendationStoreRequest;
use App\Http\Requests\Api\RecommendationUpdateRequest;
use App\Models\Recommendation;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RecommendationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $perPage = min(max((int) $request->query('per_page', 10), 1), 100);
        $clientId = $request->query('client_id');
        $voitureId = $request->query('voiture_id');

        $query = Recommendation::with(['client', 'voiture'])->latest();

        if ($clientId !== null && $clientId !== '') {
            $query->where('client_id', (int) $clientId);
        }

        if ($voitureId !== null && $voitureId !== '') {
            $query->where('voiture_id', (int) $voitureId);
        }

        return response()->json($query->paginate($perPage)->appends($request->query()));
    }

    public function store(RecommendationStoreRequest $request): JsonResponse
    {
        $data = $request->validated();

        $recommendation = Recommendation::create($data);

        return response()->json($recommendation->load(['client', 'voiture']), 201);
    }

    public function show(Recommendation $recommendation): JsonResponse
    {
        return response()->json($recommendation->load(['client', 'voiture']));
    }

    public function update(RecommendationUpdateRequest $request, Recommendation $recommendation): JsonResponse
    {
        $data = $request->validated();

        $recommendation->update($data);

        return response()->json($recommendation->load(['client', 'voiture']));
    }

    public function destroy(Recommendation $recommendation): JsonResponse
    {
        $recommendation->delete();

        return response()->json(null, 204);
    }
}
