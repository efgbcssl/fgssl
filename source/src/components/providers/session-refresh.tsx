'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useRef } from 'react';

export function SessionRefresh() {
    const { data: session, status, update } = useSession();
    const lastRefreshRef = useRef<number>(0);

    useEffect(() => {
        if (status === 'loading' || !session) return;

        // Refresh session every 6 days to keep it active
        const refreshInterval = setInterval(async () => {
            try {
                const now = Date.now();
                // Only refresh if it's been more than 6 days since last refresh
                if (now - lastRefreshRef.current > 6 * 24 * 60 * 60 * 1000) {
                    await update();
                    lastRefreshRef.current = now;
                    console.log('Session refreshed successfully');
                }
            } catch (error) {
                console.error('Failed to refresh session:', error);
            }
        }, 24 * 60 * 60 * 1000); // Check every day

        // Also refresh on page visibility change (when user comes back to tab)
        const handleVisibilityChange = async () => {
            if (document.visibilityState === 'visible' && session) {
                try {
                    const now = Date.now();
                    // Only refresh if it's been more than 1 hour since last refresh
                    if (now - lastRefreshRef.current > 60 * 60 * 1000) {
                        await update();
                        lastRefreshRef.current = now;
                        console.log('Session refreshed on visibility change');
                    }
                } catch (error) {
                    console.error('Failed to refresh session on visibility change:', error);
                }
            }
        };

        // Refresh on page focus
        const handleFocus = async () => {
            if (session) {
                try {
                    const now = Date.now();
                    // Only refresh if it's been more than 1 hour since last refresh
                    if (now - lastRefreshRef.current > 60 * 60 * 1000) {
                        await update();
                        lastRefreshRef.current = now;
                        console.log('Session refreshed on focus');
                    }
                } catch (error) {
                    console.error('Failed to refresh session on focus:', error);
                }
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('focus', handleFocus);

        return () => {
            clearInterval(refreshInterval);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('focus', handleFocus);
        };
    }, [session, status, update]);

    return null; // This component doesn't render anything
}
