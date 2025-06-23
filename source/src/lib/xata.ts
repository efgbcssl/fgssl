import { XataClient } from '@/xata'; // Xata-generated client

// Retry wrapper function
async function withRetry<T>(
    fn: () => Promise<T>,
    retries = 5,
    delayMs = 1000
): Promise<T> {
    for (let i = 0; i < retries; i++) {
        try {
            return await fn()
        } catch (error: unknown) {
            const isAbortError =
                typeof error === 'object' &&
                error !== null &&
                (
                    (error as { name?: string }).name === 'AbortError' ||
                    (error as { code?: number }).code === 20 ||
                    (error as { message?: string }).message?.includes?.('aborted')
                );

            if (i < retries - 1 && isAbortError) {
                console.warn(`Retrying Xata request (attempt ${i + 1}) due to AbortError...`)
                await new Promise((r) => setTimeout(r, delayMs * (i + 1)))
            } else {
                throw error
            }
        }
    }

    throw new Error('Failed after retries')
}

// Create Xata client with timeout support
const baseClient = new XataClient({
    apiKey: process.env.XATA_API_KEY,
    branch: process.env.XATA_BRANCH || 'main',
    fetch: (url: RequestInfo, options?: RequestInit) => {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 10000)
        return fetch(url, {
            ...options,
            signal: controller.signal
        }).finally(() => clearTimeout(timeoutId))
    }
})

// Proxy to wrap `.db` calls with retry
export const xata = new Proxy(baseClient, {
    get(target, prop, receiver) {
        const value = Reflect.get(target, prop, receiver)

        // Only wrap db operations
        if (prop === 'db') {
            const db = value

            // Wrap each table access
            return new Proxy(db, {
                get(tableTarget, tableProp, tableReceiver) {
                    const tableFn = Reflect.get(tableTarget, tableProp, tableReceiver)

                    if (typeof tableFn === 'function') {
                        // Wrap method with retry
                        return (...args: unknown[]) => withRetry(() => tableFn.apply(tableTarget, args))
                    }

                    return tableFn
                }
            })
        }

        return value
    }
})

// Helper type for API responses
export type ApiResponse<T> = {
    data?: T;
    error?: string;
    status: number;
};