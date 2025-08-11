// lib/resend.ts
import { Resend } from 'resend';

function createResend(): Resend {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    // Create a stub that throws when used
    return new Proxy({} as unknown as Resend, {
      get() {
        throw new Error('Missing RESEND_API_KEY. Set it in production to send emails.');
      },
    });
  }
  return new Resend(apiKey);
}

export const resend = createResend();
