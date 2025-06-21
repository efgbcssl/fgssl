import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import fs from 'fs/promises'
import path from 'path'

export async function generateDonationReceiptPDF({
    donorName,
    amount,
    donationType,
    receiptUrl,
    createdDate,
}: {
    donorName: string
    amount: number
    donationType: string
    receiptUrl?: string
    createdDate?: string
}) {
    const pdfDoc = await PDFDocument.create()
    const page = pdfDoc.addPage([595, 842]) // A4 size
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica)

    // 🖼️ Embed logo
    const logoPath = path.join(process.cwd(), 'public', 'logo.png')
    const logoBytes = await fs.readFile(logoPath)
    const logoImage = await pdfDoc.embedPng(logoBytes)
    const logoDims = logoImage.scale(0.2)

    page.drawImage(logoImage, {
        x: 50,
        y: 780,
        width: logoDims.width,
        height: logoDims.height,
    })

    let y = 740
    const textColor = rgb(0.2, 0.2, 0.2)
    const fontSize = 14

    function drawLine(text: string) {
        page.drawText(text, { x: 50, y, size: fontSize, font, color: textColor })
        y -= 25
    }

    drawLine('Donation Receipt')
    drawLine('--------------------------------------------')
    drawLine(`Donor Name: ${donorName}`)
    drawLine(`Donation Type: ${donationType}`)
    drawLine(`Amount: $${amount.toFixed(2)}`)
    if (createdDate) drawLine(`Date: ${createdDate}`)
    if (receiptUrl) drawLine(`Receipt URL: ${receiptUrl}`)
    drawLine('--------------------------------------------')
    drawLine('Thank you for your generous support!')

    const pdfBytes = await pdfDoc.save()
    return pdfBytes
}
