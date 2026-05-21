<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\VoitureStoreRequest;
use App\Http\Requests\Api\VoitureUpdateRequest;
use App\Models\User;
use App\Models\Voiture;
use App\Notifications\AdminAlertNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class VoitureController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $perPage = min(max((int) $request->query('per_page', 8), 1), 100);
        $queryText = trim((string) $request->query('q', ''));
        $status = $request->query('status');
        $sort = (string) $request->query('sort', 'created_at');
        $dir = strtolower((string) $request->query('dir', 'desc')) === 'asc' ? 'asc' : 'desc';

        $query = Voiture::with(['marque', 'reservations', 'calendriers']);

        if ($queryText !== '') {
            $query->where(function ($q) use ($queryText): void {
                $q->where('immatriculation', 'like', "%{$queryText}%")
                    ->orWhere('modele', 'like', "%{$queryText}%")
                    ->orWhereHas('marque', function ($mq) use ($queryText): void {
                        $mq->where('nom', 'like', "%{$queryText}%");
                    });
            });
        }

        if (in_array($status, ['disponible', 'reservee', 'maintenance'], true)) {
            $query->where('statut', $status);
        }

        if ($sort === 'marque') {
            $query->leftJoin('marques', 'marques.id', '=', 'voitures.marque_id')
                ->orderBy('marques.nom', $dir)
                ->select('voitures.*');
        } elseif (in_array($sort, ['created_at', 'modele', 'annee', 'prix_par_jour', 'statut'], true)) {
            $query->orderBy($sort, $dir);
        } else {
            $query->latest();
        }

        return response()->json($query->paginate($perPage)->appends($request->query()));
    }

    public function store(VoitureStoreRequest $request): JsonResponse
    {
        $data = $request->validated();

        if ($request->hasFile('image')) {
            $data['image_path'] = $request->file('image')->store('voitures', 'public');
        }

        $voiture = Voiture::create($data);

        return response()->json($voiture->load('marque'), 201);
    }

    public function show(Voiture $voiture): JsonResponse
    {
        return response()->json($voiture->load(['marque', 'reservations', 'calendriers', 'recommendations']));
    }

    public function update(VoitureUpdateRequest $request, Voiture $voiture): JsonResponse
    {
        $data = $request->validated();

        if (! empty($data['remove_image']) && $voiture->image_path) {
            Storage::disk('public')->delete($voiture->image_path);
            $data['image_path'] = null;
        }

        if ($request->hasFile('image')) {
            if ($voiture->image_path) {
                Storage::disk('public')->delete($voiture->image_path);
            }

            $data['image_path'] = $request->file('image')->store('voitures', 'public');
        }

        unset($data['remove_image']);

        $previousStatut = $voiture->statut;
        $voiture->update($data);

        // Notifier les admins si la voiture vient de basculer en maintenance.
        if ($previousStatut !== 'maintenance' && $voiture->statut === 'maintenance') {
            $voiture->loadMissing('marque');
            $label = trim(($voiture->marque?->nom ?? '') . ' ' . ($voiture->modele ?? ''));
            User::query()
                ->where('role', 'admin')
                ->get()
                ->each(function (User $admin) use ($voiture, $label): void {
                    $admin->notify(new AdminAlertNotification(
                        event: 'voiture_maintenance',
                        title: 'Voiture en maintenance',
                        message: "La voiture {$label} ({$voiture->immatriculation}) a ete mise en maintenance.",
                        context: ['voiture_id' => $voiture->id]
                    ));
                });
        }

        return response()->json($voiture->load('marque'));
    }

    public function destroy(Voiture $voiture): JsonResponse
    {
        if ($voiture->image_path) {
            Storage::disk('public')->delete($voiture->image_path);
        }

        $voiture->delete();

        return response()->json(null, 204);
    }
}
