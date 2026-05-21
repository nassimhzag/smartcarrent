<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\AdminController;
use App\Http\Controllers\Api\CalendrierController;
use App\Http\Controllers\Api\ClientController;
use App\Http\Controllers\Api\MarqueController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\PaiementController;
use App\Http\Controllers\Api\PredictionController;
use App\Http\Controllers\Api\RecommendationController;
use App\Http\Controllers\Api\ReservationController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\VoitureController;
use Illuminate\Support\Facades\Route;

Route::prefix('auth')->middleware('throttle:10,1')->group(function () {
    Route::post('register', [AuthController::class, 'register']);
    Route::post('login', [AuthController::class, 'login']);
});

Route::get('voitures', [VoitureController::class, 'index']);
Route::get('voitures/{voiture}', [VoitureController::class, 'show']);

Route::middleware('auth:sanctum')->group(function () {
	Route::prefix('auth')->group(function () {
		Route::get('me', [AuthController::class, 'me']);
		Route::get('dashboard', [AuthController::class, 'dashboard']);
		Route::post('logout', [AuthController::class, 'logout']);
	});

	Route::get('calendriers', [CalendrierController::class, 'index']);
	Route::get('notifications', [NotificationController::class, 'index']);
	Route::patch('notifications/{notificationId}/read', [NotificationController::class, 'markAsRead']);
	Route::patch('notifications/read-all', [NotificationController::class, 'markAllAsRead']);
	Route::get('reservations/history', [ReservationController::class, 'history']);
	Route::patch('reservations/{reservation}/cancel', [ReservationController::class, 'cancel']);

	Route::apiResource('reservations', ReservationController::class);
	Route::apiResource('paiements', PaiementController::class);
	Route::apiResource('recommendations', RecommendationController::class);

	Route::middleware('role:admin')->group(function () {
		Route::patch('paiements/{paiement}/refund', [PaiementController::class, 'refundPayment']);
		Route::patch('paiements/{paiement}/reject', [PaiementController::class, 'rejectPayment']);
		Route::patch('paiements/{paiement}/confirm', [PaiementController::class, 'confirmCashPayment']);
		Route::get('users', [UserController::class, 'index']);
		Route::delete('users/{user}', [UserController::class, 'destroy']);

		Route::apiResource('admins', AdminController::class);
		Route::apiResource('clients', ClientController::class);
		Route::apiResource('marques', MarqueController::class);
		Route::apiResource('calendriers', CalendrierController::class)->except(['index']);
		Route::apiResource('predictions', PredictionController::class);
		Route::apiResource('voitures', VoitureController::class)->except(['index', 'show']);
	});
});
