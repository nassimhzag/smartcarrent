<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('app');
});

Route::middleware('guest')->group(function () {
    Route::view('/login', 'app')->name('login');
    Route::view('/register', 'app')->name('register');
});

Route::middleware(['auth'])->group(function () {
    Route::get('/dashboard', function (Request $request) {
        return redirect($request->user()->isAdmin() ? '/admin/dashboard' : '/client/dashboard');
    });

    Route::get('/admin/dashboard', fn () => view('app'))->middleware('role:admin');
    Route::get('/admin/voitures', fn () => view('app'))->middleware('role:admin');
    Route::get('/admin/clients', fn () => view('app'))->middleware('role:admin');
    Route::get('/admin/reservations', fn () => view('app'))->middleware('role:admin');
    Route::get('/admin/paiements', fn () => view('app'))->middleware('role:admin');
    Route::get('/admin/calendrier', fn () => view('app'))->middleware('role:admin');

    Route::get('/client/dashboard', fn () => view('app'))->middleware('role:utilisateur,client');
    Route::get('/client/vehicles', fn () => view('app'))->middleware('role:utilisateur,client');
    Route::get('/client/reservations', fn () => view('app'))->middleware('role:utilisateur,client');
    Route::get('/client/paiements', fn () => view('app'))->middleware('role:utilisateur,client');
    Route::get('/client/calendrier', fn () => view('app'))->middleware('role:utilisateur,client');
    Route::get('/client/recommendations', fn () => view('app'))->middleware('role:utilisateur,client');
});
