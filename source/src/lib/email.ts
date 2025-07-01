"use server"

import nodemailer from 'nodemailer'
import ejs from 'ejs'
import path from 'path'
import fs from 'fs/promises'
import { generateDonationReceiptPDF } from './pdf'

// Metrics tracking
interface EmailMetrics {
    totalSent: number;
    totalFailed: number;
    lastFailed?: {
        emailType: string;
        recipient: string;
        error: any;
        timestamp: Date;
    };
    deliveryRate: number;
}

const emailMetrics: EmailMetrics = {
    totalSent: 0,
    totalFailed: 0,
    deliveryRate: 100,
};

// Create reusable transporter object using SMTP transport
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
    },
    pool: true,
    maxConnections: 5,
    maxMessages: 100,
    rateDelta: 1000,
    rateLimit: 5,
});

// Verify connection configuration
transporter.verify((error) => {
    if (error) {
        console.error('❌ SMTP connection error:', error)
    } else {
        console.log('✅ Server is ready to take our messages')
    }
});

async function renderTemplate(templateName: string, data: Record<string, unknown>) {
    const templatePath = path.join(process.cwd(), 'src', 'emails', `${templateName}.ejs`)
    const html = await fs.readFile(templatePath, 'utf8')
    return ejs.render(html, data, {
        root: path.join(process.cwd(), 'src', 'emails'),
    })
}

// Retry with exponential backoff
async function sendWithRetry(mailOptions: any, emailType: string, maxRetries = 3, baseDelay = 1000) {
    let attempt = 0;
    let lastError: any = null;

    while (attempt < maxRetries) {
        try {
            const info = await transporter.sendMail(mailOptions);
            emailMetrics.totalSent++;
            updateDeliveryRate();
            return { success: true, messageId: info.messageId, attempts: attempt + 1 };
        } catch (error) {
            lastError = error;
            attempt++;

            if (attempt < maxRetries) {
                const delay = baseDelay * Math.pow(2, attempt - 1) + Math.random() * 500;
                console.warn(`⚠️ Attempt ${attempt} failed for ${emailType}. Retrying in ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }

    // If we get here, all attempts failed
    emailMetrics.totalFailed++;
    updateDeliveryRate();
    emailMetrics.lastFailed = {
        emailType,
        recipient: mailOptions.to,
        error: lastError,
        timestamp: new Date(),
    };

    console.error(`❌ All ${maxRetries} attempts failed for ${emailType} to ${mailOptions.to}`);
    throw lastError;
}

function updateDeliveryRate() {
    const totalAttempts = emailMetrics.totalSent + emailMetrics.totalFailed;
    emailMetrics.deliveryRate = totalAttempts > 0
        ? (emailMetrics.totalSent / totalAttempts) * 100
        : 100;
}

// Export metrics for dashboard
export async function getEmailMetrics(): Promise<EmailMetrics> {
    return emailMetrics;
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
    try {
        const html = await renderTemplate('donation-receipt', {
            donorName,
            amount,
            donationType,
            receiptUrl,
        });

        const pdfBytes = await generateDonationReceiptPDF({
            donorName,
            amount,
            donationType,
            receiptUrl,
            createdDate,
        });

        const mailOptions = {
            from: process.env.FROM_EMAIL! || 'no-reply@yourdomain.com',
            to,
            subject: `Your ${donationType} Donation Receipt`,
            html,
            attachments: [
                {
                    filename: `Donation_Receipt_${donorName.replace(/\s+/g, '_')}.pdf`,
                    content: pdfBytes,
                    encoding: 'base64',
                },
            ],
        };

        const result = await sendWithRetry(mailOptions, 'donation-receipt');
        console.log('✅ Donation email sent to', to, 'after', result.attempts, 'attempt(s)');
        return result;
    } catch (error) {
        console.error('❌ Error sending donation email:', error);
        throw error;
    }
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
        const templatePath = path.join(process.cwd(), 'src/emails/appointment-confirmation.ejs');
        console.log('🟡 Reading email template from:', templatePath);

        const template = await fs.readFile(templatePath, 'utf-8');
        const html = ejs.render(template, {
            fullName,
            preferredDate,
            preferredTime,
            medium
        });

        console.log('📤 Sending email to:', to);
        const mailOptions = {
            from: process.env.FROM_EMAIL! || 'no-reply@yourdomain.com',
            to,
            subject: 'Your Appointment is Confirmed',
            html
        };

        const result = await sendWithRetry(mailOptions, 'appointment-confirmation');
        console.log('✅ Appointment email sent after', result.attempts, 'attempt(s)');
        return result;
    } catch (error) {
        console.error('Failed to send appointment confirmation email:', error);
        throw error;
    }
}

export async function sendReminderEmail({
    to,
    fullName,
    preferredDateTime,
    medium
}: {
    to: string
    fullName: string
    preferredDateTime: string
    medium: string
}) {
    try {
        const templatePath = path.join(process.cwd(), 'src', 'emails', 'reminder.ejs');
        const template = await fs.readFile(templatePath, 'utf-8');
        const html = ejs.render(template, { fullName, preferredDateTime, medium });

        const mailOptions = {
            from: process.env.FROM_EMAIL || 'no-reply@yourdomain.com',
            to,
            subject: 'Appointment Reminder',
            html
        };

        const result = await sendWithRetry(mailOptions, 'appointment-reminder');
        console.log('✅ Reminder email sent after', result.attempts, 'attempt(s)');
        return result;
    } catch (error) {
        console.error('❌ Failed to send reminder email:', error);
        throw error;
    }
}