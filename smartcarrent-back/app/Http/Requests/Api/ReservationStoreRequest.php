<?php

namespace App\Http\Requests\Api;

use Illuminate\Foundation\Http\FormRequest;

class ReservationStoreRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $isAdmin = $this->user()?->isAdmin() ?? false;
        $clientIdRule = $isAdmin ? ['required', 'integer', 'exists:clients,id'] : ['nullable', 'integer'];

        return [
            'client_id' => $clientIdRule,
            'voiture_id' => ['required', 'integer', 'exists:voitures,id'],
            'date_debut' => ['required', 'date'],
            'date_fin' => ['required', 'date', 'after_or_equal:date_debut'],
            'statut' => ['sometimes', 'string', 'in:en_cours,annulee,terminee'],
        ];
    }
}
