import { Resend } from 'resend'
import { DonationReceiptEmail } from '@/emails/DonationReceipt'
import { render } from '@react-email/components'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendDonationEmail({
    to,
    donorName,
    amount,
    donationType,
    receiptUrl
}: {
    to: string
    donorName: string
    amount: number
    donationType: string
    receiptUrl?: string
}) {
    const emailHtml = await render(
        DonationReceiptEmail({
            donorName,
            amount,
            donationType,
            receiptUrl,
        })
    )

    try {
        const response = await resend.emails.send({
            from: 'Church Donations <donations@yourdomain.com>',
            to,
            subject: `Thank You for Your ${donationType} Donation`,
            html: emailHtml,
        })

        return response
    } catch (error) {
        console.error('Email sending error:', error)
    }
}
