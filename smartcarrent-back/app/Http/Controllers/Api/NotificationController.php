<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $perPage = min(max((int) $request->query('per_page', 15), 1), 100);
        $onlyUnread = filter_var($request->query('unread_only', false), FILTER_VALIDATE_BOOL);

        $query = $request->user()->notifications()->latest();

        if ($onlyUnread) {
            $query->whereNull('read_at');
        }

        return response()->json([
            'notifications' => $query->paginate($perPage)->appends($request->query()),
            'unread_count' => $request->user()->unreadNotifications()->count(),
        ]);
    }

    public function markAsRead(Request $request, string $notificationId): JsonResponse
    {
        $notification = $request->user()->notifications()->whereKey($notificationId)->firstOrFail();

        if (! $notification->read_at) {
            $notification->markAsRead();
        }

        return response()->json([
            'message' => 'Notification marquee comme lue.',
            'notification' => $notification->fresh(),
            'unread_count' => $request->user()->unreadNotifications()->count(),
        ]);
    }

    public function markAllAsRead(Request $request): JsonResponse
    {
        $request->user()->unreadNotifications->markAsRead();

        return response()->json([
            'message' => 'Toutes les notifications sont marquees comme lues.',
            'unread_count' => 0,
        ]);
    }
}
