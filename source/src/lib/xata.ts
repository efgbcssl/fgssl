// Minimal lazy Xata wrapper that avoids constructing a client until a table method is actually called
import { XataClient } from '@/xata'

// Retry wrapper function
async function withRetry<T>(fn: () => Promise<T>, retries = 5, delayMs = 1000): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn()
    } catch (error: unknown) {
      const isAbortError =
        typeof error === 'object' &&
        error !== null &&
        (((error as { name?: string }).name === 'AbortError') ||
          ((error as { code?: number }).code === 20) ||
          (error as { message?: string }).message?.includes?.('aborted'))

      if (i < retries - 1 && isAbortError) {
        await new Promise((r) => setTimeout(r, delayMs * (i + 1)))
      } else {
        throw error
      }
    }
  }
  throw new Error('Failed after retries')
}

let client: XataClient | null = null
function getClient(): XataClient {
  if (client) return client
  const apiKey = process.env.XATA_API_KEY
  const branch = process.env.XATA_BRANCH || 'main'
  if (!apiKey) {
    throw new Error('XATA_API_KEY is required to access the database')
  }
  client = new XataClient({
    apiKey,
    branch,
    fetch: (url: RequestInfo, options?: RequestInit) => {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000)
      return fetch(url, { ...options, signal: controller.signal }).finally(() => clearTimeout(timeoutId))
    },
  })
  return client
}

export const xata = {
  db: new Proxy({}, {
    get(_target, tableProp, _receiver) {
      const cli = getClient() as any
      const db = cli.db as any
      const value = db[tableProp as string]
      if (typeof value === 'function') {
        return (...args: unknown[]) => withRetry(() => (value as Function).apply(db, args))
      }
      return value
    },
  }) as any,
}

export type ApiResponse<T> = { data?: T; error?: string; status: number }