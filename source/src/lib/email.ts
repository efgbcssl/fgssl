import { Resend } from 'resend'
import ejs from 'ejs'
import path from 'path'
import fs from 'fs/promises'
import { generateDonationReceiptPDF } from './pdf'

const resend = new Resend(process.env.RESEND_API_KEY)

async function renderTemplate(templateName: string, data: Record<string, any>) {
    const templatePath = path.join(process.cwd(), 'src', 'email', `${templateName}.ejs`)
    const html = await fs.readFile(templatePath, 'utf8')
    return ejs.render(html, data, {
        root: path.join(process.cwd(), 'src', 'email'), // for includes
    })
}

export async function sendDonationEmail({
    to,
    donorName,
    amount,
    donationType,
    receiptUrl,
    createdDate,
}: {
    to: string
    donorName: string
    amount: number
    donationType: string
    receiptUrl?: string
    createdDate?: string
}) {
    const html = await renderTemplate('donation-receipt', {
        donorName,
        amount,
        donationType,
        receiptUrl,
    })

    const pdfBytes = await generateDonationReceiptPDF({
        donorName,
        amount,
        donationType,
        receiptUrl,
        createdDate,
    })

    const base64PDF = Buffer.from(pdfBytes).toString('base64')

    const response = await resend.emails.send({
        from: 'Church Donations <donations@yourdomain.com>',
        to,
        subject: `Your ${donationType} Donation Receipt`,
        html,
        attachments: [
            {
                filename: `Donation_Receipt_${donorName.replace(/\s+/g, '_')}.pdf`,
                content: base64PDF,
                type: 'application/pdf',
            },
        ],
    })

    if (response.error) {
        console.error('❌ Resend API error:', response.error)
    } else {
        console.log('✅ Donation email sent to', to)
    }

    return response
}

export async function sendAppointmentEmail({
    to,
    fullName,
    preferredDate,
    preferredTime,
    medium
}: {
    to: string
    fullName: string
    preferredDate: string
    preferredTime: string
    medium: string
}) {
    try {
        const templatePath = path.join(process.cwd(), 'src/emails/appointment-confirmation.ejs')
        const template = await fs.readFile(templatePath, 'utf-8')

        const html = ejs.render(template, {
            fullName,
            preferredDate,
            preferredTime,
            medium
        })

        await resend.emails.send({
            from: 'appointments@yourdomain.com',
            to,
            subject: 'Your Appointment is Confirmed',
            html
        })
    } catch (error) {
        console.error('Failed to send appointment confirmation email:', error)
    }
}
