<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\PredictionStoreRequest;
use App\Http\Requests\Api\PredictionUpdateRequest;
use App\Models\Prediction;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PredictionController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $perPage = min(max((int) $request->query('per_page', 10), 1), 100);
        $clientId = $request->query('client_id');

        $query = Prediction::with('client')->latest();

        if ($clientId !== null && $clientId !== '') {
            $query->where('client_id', (int) $clientId);
        }

        return response()->json($query->paginate($perPage)->appends($request->query()));
    }

    public function store(PredictionStoreRequest $request): JsonResponse
    {
        $data = $request->validated();

        $prediction = Prediction::create($data);

        return response()->json($prediction->load('client'), 201);
    }

    public function show(Prediction $prediction): JsonResponse
    {
        return response()->json($prediction->load('client'));
    }

    public function update(PredictionUpdateRequest $request, Prediction $prediction): JsonResponse
    {
        $data = $request->validated();

        $prediction->update($data);

        return response()->json($prediction->load('client'));
    }

    public function destroy(Prediction $prediction): JsonResponse
    {
        $prediction->delete();

        return response()->json(null, 204);
    }
}
