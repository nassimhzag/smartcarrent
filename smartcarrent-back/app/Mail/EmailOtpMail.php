<?php

namespace App\Mail;

use App\Models\EmailOtp;
use App\Models\Utilisateur;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class EmailOtpMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public Utilisateur $user, public EmailOtp $otp)
    {
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Code de verification SmartCarRent — ' . $this->otp->code,
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.otp',
            with: [
                'user' => $this->user,
                'code' => $this->otp->code,
                'ttlMinutes' => EmailOtp::TTL_MINUTES,
            ],
        );
    }
}
