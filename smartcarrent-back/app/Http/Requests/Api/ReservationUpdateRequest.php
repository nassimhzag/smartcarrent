<?php

namespace App\Http\Requests\Api;

use Illuminate\Foundation\Http\FormRequest;

class ReservationUpdateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $isAdmin = $this->user()?->isAdmin() ?? false;

        if ($isAdmin) {
            return [
                'client_id' => ['sometimes', 'required', 'integer', 'exists:clients,id'],
                'voiture_id' => ['sometimes', 'required', 'integer', 'exists:voitures,id'],
                'date_debut' => ['sometimes', 'required', 'date'],
                'date_fin' => ['sometimes', 'required', 'date', 'after_or_equal:date_debut'],
                'statut' => ['sometimes', 'string', 'in:en_cours,annulee,terminee'],
            ];
        }

        return [
            'statut' => ['required', 'string', 'in:annulee'],
        ];
    }
}
