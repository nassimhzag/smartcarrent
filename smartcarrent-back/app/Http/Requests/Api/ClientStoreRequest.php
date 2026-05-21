<?php

namespace App\Http\Requests\Api;

use Illuminate\Foundation\Http\FormRequest;

class ClientStoreRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'user_id' => ['required', 'integer', 'exists:users,id', 'unique:clients,user_id'],
            'permis_conduire' => ['required', 'string', 'max:255', 'unique:clients,permis_conduire'],
            'telephone' => ['nullable', 'string', 'max:30'],
            'adresse' => ['required', 'string', 'max:255'],
        ];
    }
}
