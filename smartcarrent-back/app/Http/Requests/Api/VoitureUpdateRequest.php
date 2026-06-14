<?php

namespace App\Http\Requests\Api;

use Illuminate\Foundation\Http\FormRequest;

class VoitureUpdateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $voitureId = $this->route('voiture')?->id;

        return [
            'marque_id' => ['nullable', 'integer', 'exists:marques,id'],
            'immatriculation' => ['sometimes', 'required', 'string', 'max:255', 'unique:voitures,immatriculation,' . $voitureId],
            'modele' => ['sometimes', 'required', 'string', 'max:255'],
            'annee' => ['sometimes', 'required', 'integer', 'min:1900', 'max:' . ((int) date('Y') + 1)],
            'prix_par_jour' => ['sometimes', 'required', 'numeric', 'min:0'],
            // Le statut 'reservee' n'est jamais positionne manuellement : il est
            // calcule dynamiquement par l'accessor effective_statut a partir
            // des reservations en cours. L'admin choisit uniquement entre
            // disponible et maintenance.
            'statut' => ['sometimes', 'string', 'in:disponible,maintenance'],
            'categorie' => ['nullable', 'string', 'in:SUV,Berline,Citadine,Luxe,Utilitaire'],
            'image' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:4096'],
            'remove_image' => ['sometimes', 'boolean'],
        ];
    }
}
