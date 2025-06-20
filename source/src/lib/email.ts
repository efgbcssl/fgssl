// lib/email.ts
import { resend } from './resend';
import { DonationReceiptEmail } from '@/emails/DonationReceipt';
import { render } from '@react-email/render';

export async function sendDonationEmail({
    to,
    donorName,
    amount,
    donationType,
    receiptUrl
}: {
    to: string;
    donorName: string;
    amount: number;
    donationType: string;
    receiptUrl?: string;
}) {
    const html = await render(
        <DonationReceiptEmail donorName={ donorName } amount = { amount } donationType = { donationType } receiptUrl = { receiptUrl } />
    );

    const { error } = await resend.emails.send({
        from: 'donations@yourchurch.org',
        to,
        subject: 'Thank You for Your Donation',
        html,
    });

    if (error) throw new Error(`Resend error: ${error.message}`);
}
