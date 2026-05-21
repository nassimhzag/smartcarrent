<?php

namespace App\Http\Requests\Api;

use Illuminate\Foundation\Http\FormRequest;

class RecommendationStoreRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'client_id' => ['required', 'integer', 'exists:clients,id'],
            'voiture_id' => ['nullable', 'integer', 'exists:voitures,id'],
            'score' => ['required', 'numeric'],
            'date' => ['required', 'date'],
        ];
    }
}
