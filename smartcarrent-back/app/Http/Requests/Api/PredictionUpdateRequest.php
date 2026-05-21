<?php

namespace App\Http\Requests\Api;

use Illuminate\Foundation\Http\FormRequest;

class PredictionUpdateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'client_id' => ['sometimes', 'required', 'integer', 'exists:clients,id'],
            'type' => ['sometimes', 'required', 'string', 'max:255'],
            'probabilite' => ['sometimes', 'required', 'numeric', 'between:0,1'],
        ];
    }
}
