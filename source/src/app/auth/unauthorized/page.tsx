'use client'

import { useSession, signOut } from 'next-auth/react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Shield, LogOut, Home, ArrowLeft } from 'lucide-react'

export default function UnauthorizedPage() {
  const { data: session } = useSession()
  const searchParams = useSearchParams()
  const router = useRouter()
  
  const callbackUrl = searchParams.get('callbackUrl')
  const userRole = session?.user?.role

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/auth/login' })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Shield className="h-12 w-12 text-red-600 mx-auto mb-4" />
          <CardTitle className="text-2xl font-bold text-red-800">
            Access Denied
          </CardTitle>
          <CardDescription className="text-red-600">
            You don't have permission to access this resource
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <Shield className="h-4 w-4" />
            <AlertTitle>Insufficient Permissions</AlertTitle>
            <AlertDescription>
              {callbackUrl 
                ? `You need additional permissions to access "${callbackUrl}".`
                : 'You need additional permissions to access this resource.'
              }
              {userRole && (
                <>
                  <br />
                  Current role: <strong>{userRole}</strong>
                </>
              )}
            </AlertDescription>
          </Alert>

          {session ? (
            <div className="space-y-3">
              <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                <p><strong>Signed in as:</strong> {session.user?.name}</p>
                <p><strong>Email:</strong> {session.user?.email}</p>
                <p><strong>Role:</strong> {session.user?.role}</p>
              </div>

              <div className="flex flex-col space-y-3">
                <Button
                  onClick={() => router.push('/dashboard')}
                  className="w-full"
                >
                  <Home className="mr-2 h-4 w-4" />
                  Go to Dashboard
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => router.back()}
                  className="w-full"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Go Back
                </Button>

                <Button
                  variant="outline"
                  onClick={handleSignOut}
                  className="w-full text-red-600 hover:text-red-700"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-gray-600 text-center">
                Please sign in with an account that has the required permissions.
              </p>
              
              <Button
                onClick={() => router.push('/auth/login')}
                className="w-full"
              >
                Sign In
              </Button>
            </div>
          )}

          <div className="text-center text-xs text-gray-500 mt-6">
            <p>
              If you believe this is an error, please contact your administrator.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}