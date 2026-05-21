<?php

namespace App\Http\Requests\Api;

use Illuminate\Foundation\Http\FormRequest;

class PaiementStoreRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'reservation_id' => ['required', 'integer', 'exists:reservations,id', 'unique:paiements,reservation_id'],
            'montant' => ['required', 'numeric', 'min:0'],
            'date_paiement' => ['required', 'date'],
            'mode_paiement' => ['required', 'string', 'in:carte,virement,especes,mobile_money'],
        ];
    }
}
