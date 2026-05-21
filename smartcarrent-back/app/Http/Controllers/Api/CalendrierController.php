<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\CalendrierStoreRequest;
use App\Http\Requests\Api\CalendrierUpdateRequest;
use App\Models\Calendrier;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class CalendrierController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $perPage = min(max((int) $request->query('per_page', 10), 1), 100);
        $voitureId = $request->query('voiture_id');
        $disponible = $request->query('disponible');

        $query = Calendrier::with('voiture')->latest();

        if ($voitureId !== null && $voitureId !== '') {
            $query->where('voiture_id', (int) $voitureId);
        }

        if ($disponible === '0' || $disponible === '1') {
            $query->where('disponible', $disponible === '1');
        }

        return response()->json($query->paginate($perPage)->appends($request->query()));
    }

    public function store(CalendrierStoreRequest $request): JsonResponse
    {
        $data = $request->validated();

        $this->assertNoCalendarOverlap(
            $data['voiture_id'],
            $data['date_debut'],
            $data['date_fin'],
            null
        );

        $calendrier = Calendrier::create($data);

        return response()->json($calendrier->load('voiture'), 201);
    }

    public function show(Calendrier $calendrier): JsonResponse
    {
        return response()->json($calendrier->load('voiture'));
    }

    public function update(CalendrierUpdateRequest $request, Calendrier $calendrier): JsonResponse
    {
        $data = $request->validated();

        $voitureId = (int) ($data['voiture_id'] ?? $calendrier->voiture_id);
        $dateDebut = (string) ($data['date_debut'] ?? $calendrier->date_debut);
        $dateFin = (string) ($data['date_fin'] ?? $calendrier->date_fin);

        $this->assertNoCalendarOverlap(
            $voitureId,
            $dateDebut,
            $dateFin,
            $calendrier->id
        );

        $calendrier->update($data);

        return response()->json($calendrier->load('voiture'));
    }

    public function destroy(Calendrier $calendrier): JsonResponse
    {
        $calendrier->delete();

        return response()->json(null, 204);
    }

    private function assertNoCalendarOverlap(int $voitureId, string $dateDebut, string $dateFin, ?int $ignoreId): void
    {
        $query = Calendrier::query()
            ->where('voiture_id', $voitureId)
            ->whereDate('date_debut', '<=', $dateFin)
            ->whereDate('date_fin', '>=', $dateDebut);

        if ($ignoreId !== null) {
            $query->where('id', '!=', $ignoreId);
        }

        if ($query->exists()) {
            throw ValidationException::withMessages([
                'dates' => 'Une plage calendrier existe deja pour cette voiture sur cette periode.',
            ]);
        }
    }
}
