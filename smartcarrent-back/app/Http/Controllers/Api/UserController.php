<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UserController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $perPage = min(max((int) $request->query('per_page', 10), 1), 100);
        $queryText = trim((string) $request->query('q', ''));
        $role = (string) $request->query('role', 'all');

        $query = User::with(['client', 'admin'])->latest();

        if ($queryText !== '') {
            $query->where(function ($q) use ($queryText): void {
                $q->where('name', 'like', "%{$queryText}%")
                    ->orWhere('email', 'like', "%{$queryText}%");
            });
        }

        if (in_array($role, ['admin', 'client'], true)) {
            $query->where('role', $role);
        }

        return response()->json($query->paginate($perPage)->appends($request->query()));
    }

    public function destroy(Request $request, User $user): JsonResponse
    {
        if ((int) $request->user()->id === (int) $user->id) {
            return response()->json([
                'message' => 'Suppression de votre propre compte admin interdite.',
            ], 422);
        }

        $user->delete();

        return response()->json(null, 204);
    }
}