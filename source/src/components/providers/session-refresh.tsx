'use client';

import { useSession } from 'next-auth/react';
import { useEffect } from 'react';

export function SessionRefresh() {
    const { data: session, update } = useSession();

    useEffect(() => {
        if (!session) return;

        // Refresh session every 6 days to keep it active
        const refreshInterval = setInterval(async () => {
            try {
                await update();
                console.log('Session refreshed successfully');
            } catch (error) {
                console.error('Failed to refresh session:', error);
            }
        }, 6 * 24 * 60 * 60 * 1000); // 6 days

        // Also refresh on page visibility change (when user comes back to tab)
        const handleVisibilityChange = async () => {
            if (document.visibilityState === 'visible' && session) {
                try {
                    await update();
                    console.log('Session refreshed on visibility change');
                } catch (error) {
                    console.error('Failed to refresh session on visibility change:', error);
                }
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            clearInterval(refreshInterval);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [session, update]);

    return null; // This component doesn't render anything
}
