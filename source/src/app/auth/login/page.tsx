/* eslint-disable @typescript-eslint/no-unused-vars */
'use client'

import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import Image from 'next/image'

export default function SignInPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()

  // Fix callback URL to always use production domain
  const getSafeCallbackUrl = () => {
    const defaultUrl = `${window.location.origin}/dashboard`
    const callbackUrl = searchParams.get('callbackUrl')
    
    // Validate the callback URL is from our domain
    if (!callbackUrl) return defaultUrl
    try {
      const url = new URL(callbackUrl)
      if (url.origin === window.location.origin) {
        return callbackUrl
      }
      return defaultUrl
    } catch {
      return defaultUrl
    }
  }

  const handleSignIn = async (provider: 'google' | 'apple') => {
    setLoading(true)
    setError(null)
    
    try {
      const callbackUrl = getSafeCallbackUrl()
      console.log('Attempting sign in with callback:', callbackUrl) // Debug log
      
      const result = await signIn(provider, { 
        redirect: false,
        callbackUrl 
      })

      if (result?.error) {
        setError(result.error === 'Callback' ? 
          'Authentication failed. Please try again.' : 
          result.error
        )
      } else if (result?.ok) {
        console.log('Sign in successful, redirecting...') // Debug log
        window.location.href = callbackUrl // Full page reload ensures cookie/session sync
      }
    } catch (err) {
      console.error('Sign in error:', err)
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  };

  const bibleVerse = {
    text: "For where two or three gather in my name, there am I with them.",
    reference: "Matthew 18:20"
  };

  return (
    <div className="min-h-screen bg-church-light flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg overflow-hidden p-8 text-center">
        {/* Church Logo and Name */}
        <div className="mb-6 flex flex-col items-center gap-4">
          <div className="w-24 h-24 rounded-full bg-church-primary flex items-center justify-center text-white text-2xl font-bold overflow-hidden">
            <Image
              src="/logo.png"
              alt="EFGBC Logo"
              width={96}
              height={96}
              className="object-cover"
              priority
            />
          </div>
          <div className="text-church-dark font-medium">
            Ethiopian Full Gospel Believers Church <br />(Silver Spring Local)
          </div>
        </div>

        <h1 className="text-3xl font-bold text-church-dark mb-2">Welcome</h1>
        <p className="text-gray-600 mb-6">Sign in to access your church community</p>

        {/* Bible Verse */}
        <div className="bg-church-secondary/10 p-4 rounded-lg mb-8">
          <p className="italic text-church-dark">&quot;{bibleVerse.text}&quot;</p>
          <p className="text-church-secondary font-medium mt-2">{bibleVerse.reference}</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <button
            onClick={() => handleSignIn('google')}
            disabled={loading}
            className={`w-full btn btn-primary flex items-center justify-center gap-2 py-3 px-4 ${loading ? 'opacity-70' : ''}`}
          >
            {loading ? (
              <span className="loading loading-spinner"></span>
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Continue with Google
              </>
            )}
          </button>

          <button
            onClick={() => handleSignIn('apple')}
            disabled={loading}
            className={`w-full btn btn-secondary flex items-center justify-center gap-2 py-3 px-4 ${loading ? 'opacity-70' : ''}`}
          >
            {loading ? (
              <span className="loading loading-spinner"></span>
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                </svg>
                Continue with Apple
              </>
            )}
          </button>
        </div>

        <p className="text-sm text-gray-500 mt-6">
          By continuing, you agree to our <a href="/terms" className="text-church-primary hover:underline">Terms</a> and <a href="/privacy" className="text-church-primary hover:underline">Privacy Policy</a>.
        </p>
      </div>
    </div>
  )
}