<?php

namespace App\Http\Requests\Api;

use Illuminate\Foundation\Http\FormRequest;

class PredictionStoreRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'client_id' => ['required', 'integer', 'exists:clients,id'],
            'type' => ['required', 'string', 'max:255'],
            'probabilite' => ['required', 'numeric', 'between:0,1'],
        ];
    }
}
