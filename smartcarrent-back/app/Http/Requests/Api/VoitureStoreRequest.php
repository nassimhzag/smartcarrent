<?php

namespace App\Http\Requests\Api;

use Illuminate\Foundation\Http\FormRequest;

class VoitureStoreRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'marque_id' => ['nullable', 'integer', 'exists:marques,id'],
            'immatriculation' => ['required', 'string', 'max:255', 'unique:voitures,immatriculation'],
            'modele' => ['required', 'string', 'max:255'],
            'annee' => ['required', 'integer', 'min:1900', 'max:' . ((int) date('Y') + 1)],
            'prix_par_jour' => ['required', 'numeric', 'min:0'],
            'statut' => ['sometimes', 'string', 'in:disponible,reservee,maintenance'],
            'image' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:4096'],
        ];
    }
}
