import { XataClient } from '@/xata'; // This will be generated

export const xata = new XataClient({
    apiKey: process.env.XATA_API_KEY,
    branch: process.env.XATA_BRANCH || 'main',
    fetch: (url, options) => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        return fetch(url, {
            ...options,
            signal: controller.signal
        }).finally(() => clearTimeout(timeoutId));
    }
});