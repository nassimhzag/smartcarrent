<?php

namespace App\Http\Requests\Api;

use Illuminate\Foundation\Http\FormRequest;

class AdminUpdateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $adminId = $this->route('admin')?->id;

        return [
            'user_id' => ['sometimes', 'required', 'integer', 'exists:users,id', 'unique:admins,user_id,' . $adminId],
            'telephone' => ['nullable', 'string', 'max:30'],
        ];
    }
}
