<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\AdminStoreRequest;
use App\Http\Requests\Api\AdminUpdateRequest;
use App\Models\Admin;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $perPage = min(max((int) $request->query('per_page', 10), 1), 100);

        return response()->json(
            Admin::with('utilisateur')->latest()->paginate($perPage)->appends($request->query())
        );
    }

    public function store(AdminStoreRequest $request): JsonResponse
    {
        $data = $request->validated();

        $admin = Admin::create($data);

        return response()->json($admin->load('utilisateur'), 201);
    }

    public function show(Admin $admin): JsonResponse
    {
        return response()->json($admin->load('utilisateur'));
    }

    public function update(AdminUpdateRequest $request, Admin $admin): JsonResponse
    {
        $data = $request->validated();

        $admin->update($data);

        return response()->json($admin->load('utilisateur'));
    }

    public function destroy(Admin $admin): JsonResponse
    {
        $admin->delete();

        return response()->json(null, 204);
    }
}
