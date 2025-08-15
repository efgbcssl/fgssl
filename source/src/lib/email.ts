"use server"

import nodemailer from 'nodemailer'
import ejs from 'ejs'
import path from 'path'
import fs from 'fs/promises'
import { generateDonationReceiptPDF } from './pdf'
import { format, formatInTimeZone } from 'date-fns-tz'
import { resend } from './resend'

// Types
interface EmailMetrics {
    totalSent: number
    totalFailed: number
    lastFailed?: {
        emailType: string
        recipient: string
        error: unknown
        timestamp: Date
    }
    deliveryRate: number
}

interface DonationEmailParams {
    to: string
    donorName: string
    amount: number
    donationType: string
    receiptUrl?: string
    createdDate?: Date | string
    paymentMethod?: string
    currency?: string
    frequency?: string
    isRecurring: boolean
    unsubscribeLink?: string
    attachments?: Array<{
        filename: string;
        content: Buffer;
        contentType: string;
    }>;
}

interface PaymentFailedEmailParams {
    to: string
    donorName: string
    amount: number
    currency: string
    invoiceId?: string
    hostedInvoiceUrl?: string
    billingReason: string | null
    retryLink?: string
    nextRetryDate: Date | null
    updatePaymentUrl: string
    isRecurring?: boolean
    subscriptionStatus?: string | null
    willRetry?: boolean
}

interface SubscriptionConfirmationEmailData {
    to: string
    donorName: string
    amount: number
    currency: string
    frequency: string
    donationType: string
    subscriptionId: string
    nextBillingDate: Date
    manageSubscriptionUrl: string
    unsubscribeUrl: string
}

interface SubscriptionUpdateEmailData {
    to: string
    donorName: string
    subscriptionId: string
    changes: string[]
    currentAmount: number
    currency: string
    frequency: string
    nextBillingDate: Date
    subscriptionStatus: string
    manageSubscriptionUrl: string
}

interface SubscriptionCancellationEmailData {
    to: string
    donorName: string
    subscriptionId: string
    amount: number
    currency: string
    frequency: string
    cancelledAt: Date
    totalContributed: number
    reactivateUrl: string
}

// Env-based email provider selection
const USE_RESEND = process.env.NODE_ENV === 'production' && !!process.env.RESEND_API_KEY

// Metrics tracking
const emailMetrics: EmailMetrics = {
    totalSent: 0,
    totalFailed: 0,
    deliveryRate: 100,
}

// Email transporter with connection pooling (development)
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
})

// Verify connection configuration in development only
if (!USE_RESEND && process.env.SMTP_HOST) {
    transporter.verify((error) => {
        if (error) {
            console.error('❌ SMTP connection error:', error)
        } else {
            console.log('✅ SMTP server is ready to take messages')
        }
    })
}

// Template rendering helper
async function renderTemplate(templateName: string, data: Record<string, unknown>) {
    const templatePath = path.join(process.cwd(), 'src', 'emails', `${templateName}.ejs`)
    const html = await fs.readFile(templatePath, 'utf8')
    return ejs.render(html, {
        siteUrl: process.env.NEXT_PUBLIC_SITE_URL || '',
        ...data,
    }, {
        root: path.join(process.cwd(), 'src', 'emails'),
    })
}

// Unified send with retry across providers
async function sendWithRetry(
    mailOptions: nodemailer.SendMailOptions,
    emailType: string,
    maxRetries = 3,
    baseDelay = 1000
) {
    let attempt = 0
    let lastError: unknown = null

    while (attempt < maxRetries) {
        try {
            if (USE_RESEND) {
                const attachments = (mailOptions.attachments as Array<{ filename: string; content: Buffer | string; contentType?: string }> | undefined)?.map(att => ({
                    filename: att.filename,
                    content: att.content as Buffer | string,
                    contentType: att.contentType,
                }))

                const info = await resend.emails.send({
                    from: (process.env.FROM_EMAIL! || 'donations@yourchurch.org'),
                    to: [mailOptions.to as string],
                    subject: mailOptions.subject as string,
                    html: mailOptions.html as string,
                    attachments,
                })
                if (info.error) throw info.error
                emailMetrics.totalSent++
                updateDeliveryRate()
                return { success: true, messageId: info.data?.id || 'resend', attempts: attempt + 1 }
            } else {
                const info = await transporter.sendMail(mailOptions)
                emailMetrics.totalSent++
                updateDeliveryRate()
                return { success: true, messageId: info.messageId, attempts: attempt + 1 }
            }
        } catch (error) {
            lastError = error
            attempt++

            if (attempt < maxRetries) {
                const delay = baseDelay * Math.pow(2, attempt - 1) + Math.random() * 500
                console.warn(`⚠️ Attempt ${attempt} failed for ${emailType}. Retrying in ${Math.round(delay)}ms...`)
                await new Promise(resolve => setTimeout(resolve, delay))
            }
        }
    }

    // If we get here, all attempts failed
    emailMetrics.totalFailed++
    updateDeliveryRate()
    emailMetrics.lastFailed = {
        emailType,
        recipient: mailOptions.to as string,
        error: lastError,
        timestamp: new Date(),
    }

    console.error(`❌ All ${maxRetries} attempts failed for ${emailType} to ${mailOptions.to}`)
    throw lastError
}

function updateDeliveryRate() {
    const totalAttempts = emailMetrics.totalSent + emailMetrics.totalFailed
    emailMetrics.deliveryRate = totalAttempts > 0
        ? (emailMetrics.totalSent / totalAttempts) * 100
        : 100
}

// Export metrics for dashboard
export async function getEmailMetrics(): Promise<EmailMetrics> {
    return emailMetrics
}

// Main email functions
export async function sendDonationEmail(params: DonationEmailParams) {
    const receiptNumber = `DON-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`
    const formattedDate = params.createdDate
        ? new Date(params.createdDate).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })
        : new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })

    try {
        // Generate PDF receipt
        const pdfBytes = await generateDonationReceiptPDF({
            donorName: params.donorName,
            amount: params.amount,
            donationType: params.donationType,
            receiptUrl: params.receiptUrl,
            createdDate: formattedDate,
            receiptNumber,
            paymentMethod: params.paymentMethod,
            currency: params.currency,
            frequency: params.frequency,
            isRecurring: params.isRecurring
        })

        // Render email template
        const html = await renderTemplate('donation-receipt', {
            donorName: params.donorName,
            amount: params.amount,
            donationType: params.donationType,
            receiptUrl: params.receiptUrl,
            receiptNumber,
            paymentMethod: params.paymentMethod || 'Card',
            dateReceived: formattedDate,
            currency: params.currency || 'USD',
            frequency: params.frequency,
            isRecurring: params.isRecurring,
            unsubscribeLink: params.unsubscribeLink,
            currentYear: new Date().getFullYear()
        })

        const mailOptions: nodemailer.SendMailOptions = {
            from: process.env.FROM_EMAIL! || 'donations@yourchurch.org',
            to: params.to,
            subject: params.isRecurring
                ? `Thank you for your recurring ${params.donationType} donation`
                : `Thank you for your ${params.donationType} donation`,
            html,
            attachments: [
                {
                    filename: `Donation_Receipt_${receiptNumber}.pdf`,
                    content: Buffer.from(pdfBytes),
                    encoding: 'base64',
                },
            ],
        }

        const result = await sendWithRetry(mailOptions, 'donation-receipt')
        console.log('✅ Donation email sent to', params.to, 'after', result.attempts, 'attempt(s)')
        return result
    } catch (error) {
        console.error('❌ Error sending donation email:', error)
        throw error
    }
}

export async function sendPaymentFailedEmail(params: PaymentFailedEmailParams) {
    try {
        const html = await renderTemplate('payment-failed', {
            donorName: params.donorName,
            amount: params.amount,
            currency: params.currency,
            invoiceId: params.invoiceId,
            hostedInvoiceUrl: params.hostedInvoiceUrl,
            billingReason: params.billingReason,
            retryLink: params.retryLink || params.updatePaymentUrl,
            updatePaymentUrl: params.updatePaymentUrl,
            nextRetryDate: params.nextRetryDate,
            isRecurring: params.isRecurring || false,
            subscriptionStatus: params.subscriptionStatus,
            willRetry: params.willRetry || false,
            currentYear: new Date().getFullYear()
        })

        const mailOptions: nodemailer.SendMailOptions = {
            from: process.env.FROM_EMAIL! || 'donations@yourchurch.org',
            to: params.to,
            subject: `Payment ${params.isRecurring ? 'for recurring donation ' : ''}failed - Action required`,
            html
        }

        const result = await sendWithRetry(mailOptions, 'payment-failed')
        console.log('⚠️ Payment failed email sent to', params.to, 'after', result.attempts, 'attempt(s)')
        return result
    } catch (error) {
        console.error('❌ Error sending payment failed email:', error)
        throw error
    }
}

export async function sendSubscriptionConfirmationEmail(data: SubscriptionConfirmationEmailData) {
    try {
        const html = await renderTemplate('subscription-confirmation', {
            donorName: data.donorName,
            amount: data.amount,
            currency: data.currency,
            frequency: data.frequency,
            donationType: data.donationType,
            subscriptionId: data.subscriptionId,
            nextBillingDate: data.nextBillingDate.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            }),
            manageSubscriptionUrl: data.manageSubscriptionUrl,
            unsubscribeUrl: data.unsubscribeUrl,
            currentYear: new Date().getFullYear()
        })

        const mailOptions: nodemailer.SendMailOptions = {
            from: process.env.FROM_EMAIL! || 'donations@yourchurch.org',
            to: data.to,
            subject: `Thank you for your ${data.frequency} donation commitment!`,
            html
        }

        const result = await sendWithRetry(mailOptions, 'subscription-confirmation')
        console.log('✅ Subscription confirmation email sent to', data.to, 'after', result.attempts, 'attempt(s)')
        return result
    } catch (error) {
        console.error('❌ Error sending subscription confirmation email:', error)
        throw error
    }
}

export async function sendSubscriptionUpdateEmail(data: SubscriptionUpdateEmailData) {
    try {
        const html = await renderTemplate('subscription-update', {
            donorName: data.donorName,
            subscriptionId: data.subscriptionId,
            changes: data.changes,
            currentAmount: data.currentAmount,
            currency: data.currency,
            frequency: data.frequency,
            nextBillingDate: data.nextBillingDate.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            }),
            subscriptionStatus: data.subscriptionStatus,
            manageSubscriptionUrl: data.manageSubscriptionUrl,
            currentYear: new Date().getFullYear()
        })

        const mailOptions: nodemailer.SendMailOptions = {
            from: process.env.FROM_EMAIL! || 'donations@yourchurch.org',
            to: data.to,
            subject: 'Your recurring donation has been updated',
            html
        }

        const result = await sendWithRetry(mailOptions, 'subscription-update')
        console.log('🔄 Subscription update email sent to', data.to, 'after', result.attempts, 'attempt(s)')
        return result
    } catch (error) {
        console.error('❌ Error sending subscription update email:', error)
        throw error
    }
}

export async function sendSubscriptionCancellationEmail(data: SubscriptionCancellationEmailData) {
    try {
        const html = await renderTemplate('subscription-cancellation', {
            donorName: data.donorName,
            subscriptionId: data.subscriptionId,
            amount: data.amount,
            currency: data.currency,
            frequency: data.frequency,
            cancelledAt: data.cancelledAt.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            }),
            totalContributed: data.totalContributed,
            reactivateUrl: data.reactivateUrl,
            currentYear: new Date().getFullYear()
        })

        const mailOptions: nodemailer.SendMailOptions = {
            from: process.env.FROM_EMAIL! || 'donations@yourchurch.org',
            to: data.to,
            subject: 'Your recurring donation has been cancelled',
            html
        }

        const result = await sendWithRetry(mailOptions, 'subscription-cancellation')
        console.log('🗑️ Subscription cancellation email sent to', data.to, 'after', result.attempts, 'attempt(s)')
        return result
    } catch (error) {
        console.error('❌ Error sending subscription cancellation email:', error)
        throw error
    }
}

// Existing functions preserved
export async function sendAppointmentEmail({
    to,
    fullName,
    preferredDate,
    preferredTime,
    medium,
    newYorkDate,
    newYorkTime,
    timeDifference
}: {
    to: string
    fullName: string
    preferredDate: string
    preferredTime: string
    medium: string
    newYorkDate: string
    newYorkTime: string
    timeDifference: string
}) {
    try {
        const templatePath = path.join(process.cwd(), 'src/emails/appointment-confirmation.ejs')
        console.log('🟡 Reading email template from:', templatePath)

        // Read and render the template with all timezone information
        const template = await fs.readFile(templatePath, 'utf-8')
        const html = ejs.render(template, {
            siteUrl: process.env.NEXT_PUBLIC_SITE_URL || '',
            fullName,
            preferredDate,
            preferredTime,
            medium,
            newYorkDate,
            newYorkTime,
            timeDifference
        })

        console.log('📤 Sending email to:', to)
        const mailOptions = {
            from: process.env.FROM_EMAIL! || 'no-reply@efgbcssl.org',
            to,
            subject: `Your Appointment Confirmation - ${preferredDate} at ${preferredTime}`,
            html
        }

        const result = await sendWithRetry(mailOptions, 'appointment-confirmation')
        console.log('✅ Appointment email sent after', result.attempts, 'attempt(s)')
        return result
    } catch (error) {
        console.error('Failed to send appointment confirmation email:', error)
        throw error
    }
}

// Helper function to generate all timezone-aware date information
export async function generateTimezoneInfo(appointmentDate: Date) {
    const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone
    const churchTimeZone = 'America/New_York'

    // Format dates for display
    const userLocalDate = formatInTimeZone(appointmentDate, userTimeZone, 'EEEE, MMMM do, yyyy')
    const userLocalTime = formatInTimeZone(appointmentDate, userTimeZone, 'h:mm a')
    const newYorkDate = formatInTimeZone(appointmentDate, churchTimeZone, 'EEEE, MMMM do, yyyy')
    const newYorkTime = formatInTimeZone(appointmentDate, churchTimeZone, 'h:mm a')

    // Calculate time difference
    const userOffset = new Date().getTimezoneOffset()
    const nyOffset = new Date(appointmentDate.toLocaleString('en-US', {
        timeZone: churchTimeZone
    })).getTimezoneOffset()
    const diffHours = (nyOffset - userOffset) / 60
    const timeDiffText = diffHours === 0
        ? "the same as your local time"
        : `${Math.abs(diffHours)} hour${Math.abs(diffHours) > 1 ? 's' : ''} ${diffHours > 0 ? 'behind' : 'ahead'} of your local time`

    return {
        userLocalDate,
        userLocalTime,
        newYorkDate,
        newYorkTime,
        timeDifference: timeDiffText
    }
}

export async function sendMessageNotificationEmail({
    to,
    fullName,
    email,
    subject,
    message,
    adminName = "Pastoral Care Team"
}: {
    to: string
    fullName: string
    email: string
    subject?: string
    message: string
    adminName?: string
}) {
    try {
        const templatePath = path.join(process.cwd(), 'src', 'emails', 'message-notification.ejs');
        const template = await fs.readFile(templatePath, 'utf-8');

        const html = ejs.render(template, {
            siteUrl: process.env.NEXT_PUBLIC_SITE_URL || '',
            fullName,
            email,
            subject: subject || 'No Subject',
            message,
            adminName,
            date: format(new Date(), 'EEEE, MMMM d, yyyy \'at\' h:mm a')
        });

        const mailOptions = {
            from: process.env.FROM_EMAIL || 'notifications@efgbcssl.org',
            to,
            subject: `New Message: ${subject || 'Contact Form Submission'}`,
            html
        };

        const result = await sendWithRetry(mailOptions, 'message-notification');
        console.log('✅ Message notification sent to', to);
        return result;
    } catch (error) {
        console.error('❌ Failed to send message notification:', error);
        throw error;
    }
}

export async function sendEventRegistrationEmail({
    to,
    fullName,
    eventName,
    eventDate,
    eventTime,
    eventLocation,
    additionalDetails,
    contactEmail,
    contactPhone,
}: {
    to: string
    fullName: string
    eventName: string
    eventDate: string
    eventTime: string
    eventLocation: string
    additionalDetails?: string
    contactEmail?: string
    contactPhone?: string
}) {
    try {
        const html = await renderTemplate('event-registration', {
            fullName,
            eventName,
            eventDate,
            eventTime,
            eventLocation,
            additionalDetails: additionalDetails || 'None provided',
            contactEmail: contactEmail || 'Not specified',
            contactPhone: contactPhone || 'Not specified',
            currentYear: new Date().getFullYear(),
        });

        const mailOptions = {
            from: process.env.FROM_EMAIL! || 'events@yourdomain.com',
            to,
            subject: `Registration Confirmation: ${eventName}`,
            html,
        };

        const result = await sendWithRetry(mailOptions, 'event-registration');
        console.log('✅ Event registration email sent to', to, 'after', result.attempts, 'attempt(s)');
        return result;
    } catch (error) {
        console.error('❌ Error sending event registration email:', error);
        throw error;
    }
}

export async function sendReminderEmail({
    to,
    fullName,
    preferredDate,
    preferredTime,
    medium,
    newYorkDate,
    newYorkTime,
    timeDifference,
    meetingLink,
    rescheduleLink,
    cancelLink,
    unsubscribeLink

}: {
    to: string
    fullName: string
    preferredDate: string
    preferredTime: string
    medium: string
    newYorkDate: string
    newYorkTime: string
    timeDifference: string
    meetingLink: string
    rescheduleLink: string
    cancelLink: string
    unsubscribeLink: string
}) {
    try {
        const templatePath = path.join(process.cwd(), 'src/emails/appointment-reminder.ejs')
        console.log('🟡 Reading reminder template from:', templatePath)

        // Read and render the template with all timezone information
        const template = await fs.readFile(templatePath, 'utf-8')
        const html = ejs.render(template, {
            siteUrl: process.env.NEXT_PUBLIC_SITE_URL || '',
            fullName,
            preferredDate,
            preferredTime,
            medium,
            newYorkDate,
            newYorkTime,
            timeDifference,
            currentYear: new Date().getFullYear(),
            meetingLink,
            rescheduleLink,
            cancelLink,
            unsubscribeLink
        })

        console.log('📤 Sending reminder to:', to)
        const mailOptions = {
            from: process.env.FROM_EMAIL! || 'no-reply@efgbcssl.org',
            to,
            subject: `Reminder: Your Upcoming Appointment - ${preferredDate} at ${preferredTime}`,
            html
        }

        const result = await sendWithRetry(mailOptions, 'appointment-reminder')
        console.log('✅ Reminder email sent after', result.attempts, 'attempt(s)')
        return result
    } catch (error) {
        console.error('Failed to send appointment reminder email:', error)
        throw error
    }
}