<?php

namespace App\Http\Requests\Api;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

class AuthRegisterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name'            => ['required', 'string', 'max:255'],
            'email'           => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'password'        => ['required', 'confirmed', Password::min(8)->letters()->numbers()->mixedCase()->symbols()],
            'permis_conduire' => ['required', 'string', 'max:255', 'unique:clients,permis_conduire'],
            'telephone'       => ['nullable', 'string', 'max:30'],
            'adresse'         => ['required', 'string', 'max:255'],
        ];
    }

    public function messages(): array
    {
        return [
            'password.confirmed' => 'Erreur de confirmation du mot de passe',
            'password.min'       => 'mot de passe faible',
            'password.letters'   => 'mot de passe faible',
            'password.numbers'   => 'mot de passe faible',
            'password.mixed'     => 'mot de passe faible',
            'password.symbols'    => 'mot de passe faible',
            'email.unique'        => "Cet email est déjà utilisé",
            'permis_conduire.unique' => "Ce permis est déjà utilisé",
        ];
    }
}