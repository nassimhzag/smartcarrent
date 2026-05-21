<?php

namespace App\Http\Requests\Api;

use Illuminate\Foundation\Http\FormRequest;

class RecommendationUpdateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'client_id' => ['sometimes', 'required', 'integer', 'exists:clients,id'],
            'voiture_id' => ['nullable', 'integer', 'exists:voitures,id'],
            'score' => ['sometimes', 'required', 'numeric'],
            'date' => ['sometimes', 'required', 'date'],
        ];
    }
}
