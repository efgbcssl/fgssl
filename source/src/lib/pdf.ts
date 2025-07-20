import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import fontkit from '@pdf-lib/fontkit'
import fs from 'fs'
import path from 'path'

interface DonationReceiptPDFParams {
    donorName: string
    amount: number
    donationType: string
    receiptUrl?: string
    createdDate: string
    receiptNumber: string
    paymentMethod?: string
    currency?: string
    frequency?: string
    isRecurring: boolean
}

const churchLogo = fs.readFileSync(path.resolve('public/logo.png'))
export async function generateDonationReceiptPDF(params: DonationReceiptPDFParams): Promise<Buffer> {
    try {
        console.log('📝 Generating donation receipt PDF...')

        // Create a new PDF document
        const pdfDoc = await PDFDocument.create()
        pdfDoc.registerFontkit(fontkit)

        // Embed fonts
        const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica)
        const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

        // Add a new page with proper margins (1 inch all around)
        const page = pdfDoc.addPage([612, 792]) // Letter size (8.5 x 11 inches)
        const { width, height } = page.getSize()
        const margin = 72 // 1 inch margin

        // Draw church logo
        const logoImage = await pdfDoc.embedPng(churchLogo)
        const logoDims = logoImage.scale(0.5)
        page.drawImage(logoImage, {
            x: margin,
            y: height - margin - logoDims.height,
            width: logoDims.width,
            height: logoDims.height,
        })

        // Add church info
        page.drawText('Ethiopian Full Gospel Believers Church', {
            x: margin,
            y: height - margin - logoDims.height - 24,
            size: 16,
            font: helveticaBold,
            color: rgb(0, 0, 0),
        })
        page.drawText('914 Silver Spring Ave, Suite 204 B, Silver Spring, MD 20910', {
            x: margin,
            y: height - margin - logoDims.height - 42,
            size: 10,
            font: helvetica,
            color: rgb(0.3, 0.3, 0.3),
        })

        // Add receipt title
        const titleText = params.isRecurring
            ? `RECURRING DONATION RECEIPT - ${params.frequency?.toUpperCase()}`
            : 'DONATION RECEIPT'
        page.drawText(titleText, {
            x: margin,
            y: height - margin - logoDims.height - 80,
            size: 18,
            font: helveticaBold,
            color: rgb(0.2, 0.4, 0.6),
        })

        // Add receipt date and number
        page.drawText(`Receipt #: ${params.receiptNumber}`, {
            x: width - margin - 150,
            y: height - margin - logoDims.height - 80,
            size: 12,
            font: helveticaBold,
            color: rgb(0, 0, 0),
        })
        page.drawText(`Date: ${params.createdDate}`, {
            x: width - margin - 150,
            y: height - margin - logoDims.height - 96,
            size: 12,
            font: helvetica,
            color: rgb(0, 0, 0),
        })

        // Add donor information section
        page.drawText('Donor Information:', {
            x: margin,
            y: height - margin - logoDims.height - 130,
            size: 14,
            font: helveticaBold,
            color: rgb(0.2, 0.4, 0.6),
        })
        page.drawText(params.donorName, {
            x: margin + 20,
            y: height - margin - logoDims.height - 150,
            size: 12,
            font: helvetica,
            color: rgb(0, 0, 0),
        })

        // Add donation details section
        page.drawText('Donation Details:', {
            x: margin,
            y: height - margin - logoDims.height - 190,
            size: 14,
            font: helveticaBold,
            color: rgb(0.2, 0.4, 0.6),
        })

        // Draw donation details table
        const donationDetails = [
            { label: 'Donation Type:', value: params.donationType },
            { label: 'Amount:', value: `${params.currency || 'USD'} ${params.amount.toFixed(2)}` },
            { label: 'Payment Method:', value: params.paymentMethod || 'Credit Card' },
            ...(params.isRecurring ? [{ label: 'Frequency:', value: params.frequency || 'Monthly' }] : []),
            ...(params.receiptUrl ? [{ label: 'Transaction ID:', value: params.receiptUrl }] : []),
        ]

        donationDetails.forEach((detail, index) => {
            const yPos = height - margin - logoDims.height - 210 - (index * 20)

            page.drawText(detail.label, {
                x: margin + 20,
                y: yPos,
                size: 12,
                font: helveticaBold,
                color: rgb(0.3, 0.3, 0.3),
            })

            page.drawText(detail.value, {
                x: margin + 120,
                y: yPos,
                size: 12,
                font: helvetica,
                color: rgb(0, 0, 0),
            })
        })

        // Add thank you message
        page.drawText('Thank you for your generous support!', {
            x: margin,
            y: height - margin - logoDims.height - 320,
            size: 14,
            font: helveticaBold,
            color: rgb(0.2, 0.4, 0.6),
        })

        // Add bible verse
        page.drawText('"Each of you should give what you have decided in your heart to give,', {
            x: margin,
            y: height - margin - logoDims.height - 350,
            size: 11,
            font: helvetica,
            color: rgb(0.4, 0.4, 0.4),
        })
        page.drawText('not reluctantly or under compulsion, for God loves a cheerful giver."', {
            x: margin,
            y: height - margin - logoDims.height - 365,
            size: 11,
            font: helvetica,
            color: rgb(0.4, 0.4, 0.4),
        })
        page.drawText('- 2 Corinthians 9:7', {
            x: margin,
            y: height - margin - logoDims.height - 380,
            size: 11,
            font: helvetica,
            color: rgb(0.4, 0.4, 0.4),
        })

        // Add tax disclaimer
        page.drawText('Tax Deduction Information:', {
            x: margin,
            y: height - margin - logoDims.height - 420,
            size: 10,
            font: helveticaBold,
            color: rgb(0.3, 0.3, 0.3),
        })
        page.drawText('Ethiopian Full Gospel Believers Church is a registered 501(c)(3) organization.', {
            x: margin,
            y: height - margin - logoDims.height - 435,
            size: 10,
            font: helvetica,
            color: rgb(0.3, 0.3, 0.3),
        })
        page.drawText('No goods or services were provided in exchange for this donation.', {
            x: margin,
            y: height - margin - logoDims.height - 450,
            size: 10,
            font: helvetica,
            color: rgb(0.3, 0.3, 0.3),
        })
        page.drawText('This receipt may be used for tax deduction purposes.', {
            x: margin,
            y: height - margin - logoDims.height - 465,
            size: 10,
            font: helvetica,
            color: rgb(0.3, 0.3, 0.3),
        })

        // Add footer
        page.drawLine({
            start: { x: margin, y: margin + 40 },
            end: { x: width - margin, y: margin + 40 },
            thickness: 0.5,
            color: rgb(0.8, 0.8, 0.8),
        })
        page.drawText('For any questions about your donation, please contact:', {
            x: margin,
            y: margin + 30,
            size: 10,
            font: helvetica,
            color: rgb(0.3, 0.3, 0.3),
        })
        page.drawText('giving@efgbcssl.org | (240) 821-0361 | efgbcssl.org', {
            x: margin,
            y: margin + 15,
            size: 10,
            font: helvetica,
            color: rgb(0.3, 0.3, 0.3),
        })

        // Serialize the PDF to bytes
        const pdfBytes = await pdfDoc.save()

        return Buffer.from(pdfBytes)
    } catch (error) {
        console.error('Error generating donation receipt PDF:', error)
        throw new Error('Failed to generate donation receipt')
    }
}