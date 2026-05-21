<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\MarqueStoreRequest;
use App\Http\Requests\Api\MarqueUpdateRequest;
use App\Models\Marque;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MarqueController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $perPage = min(max((int) $request->query('per_page', 10), 1), 100);
        $queryText = trim((string) $request->query('q', ''));

        $query = Marque::with('voitures')->latest();

        if ($queryText !== '') {
            $query->where(function ($q) use ($queryText): void {
                $q->where('nom', 'like', "%{$queryText}%")
                    ->orWhere('pays', 'like', "%{$queryText}%");
            });
        }

        return response()->json($query->paginate($perPage)->appends($request->query()));
    }

    public function store(MarqueStoreRequest $request): JsonResponse
    {
        $data = $request->validated();

        $marque = Marque::create($data);

        return response()->json($marque, 201);
    }

    public function show(Marque $marque): JsonResponse
    {
        return response()->json($marque->load('voitures'));
    }

    public function update(MarqueUpdateRequest $request, Marque $marque): JsonResponse
    {
        $data = $request->validated();

        $marque->update($data);

        return response()->json($marque);
    }

    public function destroy(Marque $marque): JsonResponse
    {
        $marque->delete();

        return response()->json(null, 204);
    }
}
