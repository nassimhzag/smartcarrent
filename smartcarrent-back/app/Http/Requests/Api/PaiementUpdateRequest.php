<?php

namespace App\Http\Requests\Api;

use Illuminate\Foundation\Http\FormRequest;

class PaiementUpdateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $paiementId = $this->route('paiement')?->id;

        return [
            'reservation_id' => ['sometimes', 'required', 'integer', 'exists:reservations,id', 'unique:paiements,reservation_id,' . $paiementId],
            'montant' => ['sometimes', 'required', 'numeric', 'min:0'],
            'date_paiement' => ['sometimes', 'required', 'date'],
            'mode_paiement' => ['sometimes', 'required', 'string', 'in:carte,virement,especes,mobile_money'],
        ];
    }
}
