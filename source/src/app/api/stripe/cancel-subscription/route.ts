import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import stripe from '@/lib/stripe';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    const subscriptionId = searchParams.get('sub');

    if (!token || !subscriptionId) {
        return NextResponse.redirect(new URL('/donations/manage?error=invalid_link', request.url));
    }

    try {
        // Verify token
        const decoded = jwt.verify(token, process.env.SECRET_KEY_FOR_TOKENS!) as {
            sub: string;
            email: string;
            exp: number;
        };

        // Check if token matches subscription ID
        if (decoded.sub !== subscriptionId) {
            throw new Error('Token/subscription mismatch');
        }

        // Check expiration
        if (decoded.exp < Date.now() / 1000) {
            return NextResponse.redirect(new URL('/donations/manage?error=expired_link', request.url));
        }

        // Cancel subscription
        const cancelledSubscription = await stripe.subscriptions.cancel(subscriptionId);
        console.log('Subscription cancelled:', cancelledSubscription.id);

        // Redirect to confirmation page
        return NextResponse.redirect(new URL('/donations/manage?cancelled=true', request.url));

    } catch (error) {
        console.error('Cancellation error:', error);
        return NextResponse.redirect(new URL('/donations/manage?error=cancellation_failed', request.url));
    }
}