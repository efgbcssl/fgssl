import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import fs from 'fs/promises'
import path from 'path'

interface DonationReceiptPDFParams {
    donorName: string
    amount: number
    donationType: string
    receiptUrl?: string
    createdDate?: string | Date
    receiptNumber: string
    paymentMethod?: string
    currency?: string
}

export async function generateDonationReceiptPDF({
    donorName,
    amount,
    donationType,
    receiptUrl,
    createdDate,
    receiptNumber,
    paymentMethod = 'Credit Card',
    currency = 'USD'
}: DonationReceiptPDFParams) {
    // Create a new PDF document
    const pdfDoc = await PDFDocument.create()
    const page = pdfDoc.addPage([595, 842]) // A4 size (595 × 842 points)

    // Load fonts
    const [helvetica, helveticaBold] = await Promise.all([
        pdfDoc.embedFont(StandardFonts.Helvetica),
        pdfDoc.embedFont(StandardFonts.HelveticaBold)
    ])

    // Colors
    const primaryColor = rgb(0.29, 0.44, 0.65) // #4a6fa5
    const textColor = rgb(0.2, 0.2, 0.2) // #333333
    const lightGray = rgb(0.95, 0.95, 0.95)
    const borderColor = rgb(0.85, 0.85, 0.85)

    // 🖼️ Embed logo
    try {
        const logoPath = path.join(process.cwd(), 'public', 'fg-logo.jpg')
        const logoBytes = await fs.readFile(logoPath)
        const logoImage = await pdfDoc.embedJpg(logoBytes)
        const logoDims = logoImage.scale(0.15) // Adjust scale as needed

        page.drawImage(logoImage, {
            x: 50,
            y: 780 - logoDims.height,
            width: logoDims.width,
            height: logoDims.height,
        })
    } catch (error) {
        console.warn(error, 'Could not load logo, proceeding without it')
    }

    // Header
    let yPosition = 700
    const leftMargin = 50
    const rightMargin = 545
    const lineHeight = 20
    const sectionGap = 15

    // Church name
    page.drawText('Ethiopian Full Gospel Believers Church (Silver Spring Local)', {
        x: leftMargin,
        y: yPosition,
        size: 18,
        font: helveticaBold,
        color: primaryColor
    })
    yPosition -= lineHeight + 5

    // Church motto
    page.drawText('Serving Christ Together', {
        x: leftMargin,
        y: yPosition,
        size: 12,
        font: helvetica,
        color: textColor
    })
    yPosition -= lineHeight + sectionGap

    // Title
    page.drawText('DONATION RECEIPT', {
        x: leftMargin,
        y: yPosition,
        size: 16,
        font: helveticaBold,
        color: primaryColor
    })
    yPosition -= lineHeight + sectionGap

    // Receipt details box
    const detailsBoxHeight = 150
    page.drawRectangle({
        x: leftMargin,
        y: yPosition - detailsBoxHeight,
        width: rightMargin - leftMargin,
        height: detailsBoxHeight,
        color: lightGray,
        borderColor: primaryColor,
        borderWidth: 1,
    })

    // Details content
    let detailsY = yPosition - 30
    const detailLineHeight = 20

    function drawDetail(label: string, value: string | number, isBold = false) {
        page.drawText(`${label}:`, {
            x: leftMargin + 10,
            y: detailsY,
            size: 12,
            font: isBold ? helveticaBold : helvetica,
            color: primaryColor
        })

        page.drawText(String(value), {
            x: leftMargin + 120,
            y: detailsY,
            size: 12,
            font: isBold ? helveticaBold : helvetica,
            color: textColor
        })

        detailsY -= detailLineHeight
    }

    // Format date
    const formattedDate = createdDate
        ? new Date(createdDate).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })
        : new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })

    // Draw details
    drawDetail('Receipt Number', receiptNumber, true)
    drawDetail('Date', formattedDate)
    drawDetail('Donor Name', donorName)
    drawDetail('Donation Type', donationType)
    drawDetail('Amount', `${currency} ${amount.toFixed(2)}`, true)
    drawDetail('Payment Method', paymentMethod)
    drawDetail('Receipt URL', receiptUrl ?? 'N/A')

    yPosition -= detailsBoxHeight + sectionGap * 2

    // Thank you message
    page.drawText('Thank you for your generous support!', {
        x: leftMargin,
        y: yPosition,
        size: 14,
        font: helveticaBold,
        color: primaryColor
    })
    yPosition -= lineHeight + 10

    // Bible verse
    page.drawText('"Each of you should give what you have decided in your heart to give,', {
        x: leftMargin,
        y: yPosition,
        size: 11,
        font: helvetica,
        color: textColor,
        opacity: 0.8
    })
    yPosition -= lineHeight - 5

    page.drawText('not reluctantly or under compulsion, for God loves a cheerful giver."', {
        x: leftMargin,
        y: yPosition,
        size: 11,
        font: helvetica,
        color: textColor,
        opacity: 0.8
    })
    yPosition -= lineHeight - 5

    page.drawText('- 2 Corinthians 9:7', {
        x: leftMargin,
        y: yPosition,
        size: 11,
        font: helvetica,
        color: textColor,
        opacity: 0.8
    })
    yPosition -= lineHeight + sectionGap

    // Footer
    const footerY = 50
    page.drawText('Ethiopian Full Gospel Believers Church (Silver Spring Local)', {
        x: leftMargin,
        y: footerY,
        size: 10,
        font: helvetica,
        color: textColor,
        opacity: 0.7
    })

    page.drawText('914 Silver Spring Ave, Suite 204 B, Silver Spring, MD 20910, USA', {
        x: leftMargin,
        y: footerY - 15,
        size: 10,
        font: helvetica,
        color: textColor,
        opacity: 0.7
    })

    page.drawText('This receipt may be used for tax purposes. No goods or services were provided in exchange for this donation.', {
        x: leftMargin,
        y: footerY - 30,
        size: 9,
        font: helvetica,
        color: textColor,
        opacity: 0.6
    })

    // Add border around entire page
    page.drawRectangle({
        x: 20,
        y: 20,
        width: 555,
        height: 802,
        borderColor: borderColor,
        borderWidth: 1,
    })

    // Return the PDF bytes
    return await pdfDoc.save()
}