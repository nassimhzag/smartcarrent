<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\AdminController;
use App\Http\Controllers\Api\AdminDashboardController;
use App\Http\Controllers\Api\ClientController;
use App\Http\Controllers\Api\EmailVerificationController;
use App\Http\Controllers\Api\FactureController;
use App\Http\Controllers\Api\MarqueController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\PaiementController;
use App\Http\Controllers\Api\PasswordResetController;
use App\Http\Controllers\Api\ProfileController;
use App\Http\Controllers\Api\PredictionController;
use App\Http\Controllers\Api\RecommendationController;
use App\Http\Controllers\Api\ReservationController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\VoitureController;
use Illuminate\Support\Facades\Route;

Route::prefix('auth')->middleware('throttle:10,1')->group(function () {
    Route::post('register', [AuthController::class, 'register']);
    Route::post('login', [AuthController::class, 'login']);
    Route::post('verify-otp', [EmailVerificationController::class, 'verify']);
    Route::post('resend-otp', [EmailVerificationController::class, 'resend'])->middleware('throttle:6,1');
    Route::post('forgot-password', [PasswordResetController::class, 'forgot'])->middleware('throttle:6,1');
    Route::post('reset-password', [PasswordResetController::class, 'reset']);
});

Route::get('voitures', [VoitureController::class, 'index']);
Route::get('voitures/{voiture}', [VoitureController::class, 'show']);

Route::middleware('auth:sanctum')->group(function () {
	Route::prefix('auth')->group(function () {
		Route::get('me', [AuthController::class, 'me']);
		Route::get('dashboard', [AuthController::class, 'dashboard']);
		Route::post('logout', [AuthController::class, 'logout']);
	});

	Route::get('notifications', [NotificationController::class, 'index']);
	Route::patch('notifications/{notificationId}/read', [NotificationController::class, 'markAsRead']);
	Route::patch('notifications/read-all', [NotificationController::class, 'markAllAsRead']);
	Route::get('reservations/history', [ReservationController::class, 'history']);
	Route::patch('reservations/{reservation}/cancel', [ReservationController::class, 'cancel']);
	Route::put('me/profile', [ProfileController::class, 'updateProfile']);
	Route::put('me/password', [ProfileController::class, 'changePassword']);
	Route::get('reservations/{reservation}/facture', [FactureController::class, 'download']);

	Route::apiResource('reservations', ReservationController::class);
	Route::apiResource('paiements', PaiementController::class);
	Route::apiResource('recommendations', RecommendationController::class);

	Route::middleware('role:admin')->group(function () {
		Route::get('admin/dashboard/stats', [AdminDashboardController::class, 'stats']);
		Route::patch('paiements/{paiement}/refund', [PaiementController::class, 'refundPayment']);
		Route::patch('reservations/{reservation}/terminer', [ReservationController::class, 'terminer']);
		Route::get('users', [UserController::class, 'index']);
		Route::delete('users/{user}', [UserController::class, 'destroy']);

		Route::apiResource('admins', AdminController::class);
		Route::apiResource('clients', ClientController::class);
		Route::apiResource('marques', MarqueController::class);
		Route::apiResource('predictions', PredictionController::class);
		Route::apiResource('voitures', VoitureController::class)->except(['index', 'show']);
	});
});
