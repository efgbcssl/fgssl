'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { User, Mail, Shield, Calendar, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function ProfilePage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600" />
      </div>
    )
  }

  if (!session) {
    router.push('/auth/login')
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Link>
              </Button>
              <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid gap-6">
          {/* Profile Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5 text-blue-600" />
                <span>Profile Information</span>
              </CardTitle>
              <CardDescription>
                View your account details and current role permissions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Full Name</label>
                    <p className="text-lg font-semibold text-gray-900">
                      {session.user?.name || 'Not provided'}
                    </p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-600">Email Address</label>
                    <div className="flex items-center space-x-2">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <p className="text-lg text-gray-900">
                        {session.user?.email}
                      </p>
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-600">User ID</label>
                    <p className="text-sm font-mono text-gray-600 bg-gray-100 px-3 py-2 rounded">
                      {session.user?.id}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Current Role</label>
                    <div className="flex items-center space-x-2">
                      <Shield className="h-4 w-4 text-gray-400" />
                      <Badge 
                        className={
                          session.user?.role === 'admin' 
                            ? 'bg-red-100 text-red-800'
                            : session.user?.role === 'manager'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-green-100 text-green-800'
                        }
                      >
                        {session.user?.role?.toUpperCase()}
                      </Badge>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-600">Profile Picture</label>
                    <div className="flex items-center space-x-3">
                      {session.user?.image ? (
                        <img
                          src={session.user.image}
                          alt={session.user.name || 'Profile'}
                          className="w-12 h-12 rounded-full"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                          <User className="h-6 w-6 text-gray-400" />
                        </div>
                      )}
                      <span className="text-sm text-gray-600">
                        {session.user?.image ? 'Connected to OAuth provider' : 'No profile picture'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Separator />

          {/* Role Permissions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5 text-blue-600" />
                <span>Role Permissions</span>
              </CardTitle>
              <CardDescription>
                What you can access with your current role: {session.user?.role}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Available Features</h4>
                  <ul className="space-y-2">
                    {session.user?.role === 'admin' && (
                      <>
                        <li className="flex items-center space-x-2 text-sm">
                          <div className="w-2 h-2 bg-green-500 rounded-full" />
                          <span>Full system administration</span>
                        </li>
                        <li className="flex items-center space-x-2 text-sm">
                          <div className="w-2 h-2 bg-green-500 rounded-full" />
                          <span>User management</span>
                        </li>
                        <li className="flex items-center space-x-2 text-sm">
                          <div className="w-2 h-2 bg-green-500 rounded-full" />
                          <span>All donation access</span>
                        </li>
                        <li className="flex items-center space-x-2 text-sm">
                          <div className="w-2 h-2 bg-green-500 rounded-full" />
                          <span>System settings</span>
                        </li>
                      </>
                    )}
                    
                    {session.user?.role === 'manager' && (
                      <>
                        <li className="flex items-center space-x-2 text-sm">
                          <div className="w-2 h-2 bg-green-500 rounded-full" />
                          <span>Donation management</span>
                        </li>
                        <li className="flex items-center space-x-2 text-sm">
                          <div className="w-2 h-2 bg-green-500 rounded-full" />
                          <span>Analytics access</span>
                        </li>
                        <li className="flex items-center space-x-2 text-sm">
                          <div className="w-2 h-2 bg-green-500 rounded-full" />
                          <span>Report generation</span>
                        </li>
                        <li className="flex items-center space-x-2 text-sm">
                          <div className="w-2 h-2 bg-green-500 rounded-full" />
                          <span>Basic settings</span>
                        </li>
                      </>
                    )}
                    
                    {session.user?.role === 'member' && (
                      <>
                        <li className="flex items-center space-x-2 text-sm">
                          <div className="w-2 h-2 bg-green-500 rounded-full" />
                          <span>Profile management</span>
                        </li>
                        <li className="flex items-center space-x-2 text-sm">
                          <div className="w-2 h-2 bg-green-500 rounded-full" />
                          <span>Activity viewing</span>
                        </li>
                        <li className="flex items-center space-x-2 text-sm">
                          <div className="w-2 h-2 bg-green-500 rounded-full" />
                          <span>Basic dashboard</span>
                        </li>
                      </>
                    )}
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Access Information</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Dashboard Access:</span>
                      <Badge variant="outline" className="text-green-600">
                        Granted
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Admin Panel:</span>
                      <Badge variant="outline" className={
                        session.user?.role === 'admin' ? 'text-green-600' : 'text-red-600'
                      }>
                        {session.user?.role === 'admin' ? 'Granted' : 'Denied'}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">User Management:</span>
                      <Badge variant="outline" className={
                        session.user?.role === 'admin' ? 'text-green-600' : 'text-red-600'
                      }>
                        {session.user?.role === 'admin' ? 'Granted' : 'Denied'}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Donation Access:</span>
                      <Badge variant="outline" className={
                        ['admin', 'manager'].includes(session.user?.role || '') ? 'text-green-600' : 'text-red-600'
                      }>
                        {['admin', 'manager'].includes(session.user?.role || '') ? 'Granted' : 'Denied'}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <div className="flex justify-center space-x-4">
            <Button variant="outline" asChild>
              <Link href="/dashboard">
                Back to Dashboard
              </Link>
            </Button>
            
            <Button variant="outline" asChild>
              <Link href="/">
                Back to Website
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
