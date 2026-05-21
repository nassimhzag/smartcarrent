<?php

namespace App\Http\Requests\Api;

use Illuminate\Foundation\Http\FormRequest;

class ClientUpdateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $clientId = $this->route('client')?->id;

        return [
            'user_id' => ['sometimes', 'required', 'integer', 'exists:users,id', 'unique:clients,user_id,' . $clientId],
            'permis_conduire' => ['sometimes', 'required', 'string', 'max:255', 'unique:clients,permis_conduire,' . $clientId],
            'telephone' => ['nullable', 'string', 'max:30'],
            'adresse' => ['sometimes', 'required', 'string', 'max:255'],
        ];
    }
}
