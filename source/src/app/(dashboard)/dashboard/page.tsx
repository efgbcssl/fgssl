/* eslint-disable @typescript-eslint/no-unused-vars */


 
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  User, 
  Settings, 
  BarChart3, 
  Users, 
  DollarSign, 
  FileText,
  LogOut,
  Shield,
  Calendar,
  Activity
} from 'lucide-react'
import Link from 'next/link'
import { auth } from '@/auth';

interface DashboardCard {
  title: string
  description: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  roles: string[]
  count?: number
}

const dashboardCards: DashboardCard[] = [
  {
    title: 'Users Management',
    description: 'Manage user accounts and permissions',
    href: '/dashboard/users',
    icon: Users,
    roles: ['admin'],
  },
  {
    title: 'Donations Overview',
    description: 'View and manage donations',
    href: '/dashboard/donations',
    icon: DollarSign,
    roles: ['admin', 'manager'],
  },
  {
    title: 'Analytics & Reports',
    description: 'View detailed analytics and generate reports',
    href: '/dashboard/analytics',
    icon: BarChart3,
    roles: ['admin', 'manager'],
  },
  {
    title: 'Settings',
    description: 'Configure application settings',
    href: '/dashboard/settings',
    icon: Settings,
    roles: ['admin', 'manager'],
  },
  {
    title: 'My Profile',
    description: 'View and edit your profile',
    href: '/dashboard/profile',
    icon: User,
    roles: ['admin', 'manager', 'member'],
  },
  {
    title: 'Activity Log',
    description: 'View your recent activity',
    href: '/dashboard/activity',
    icon: Activity,
    roles: ['admin', 'manager', 'member'],
  },
]

function getRoleColor(role: string): string {
  switch (role) {
    case 'admin':
      return 'bg-red-100 text-red-800'
    case 'manager':
      return 'bg-blue-100 text-blue-800'
    case 'member':
      return 'bg-green-100 text-green-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

function getRolePermissions(role: string): string[] {
  switch (role) {
    case 'admin':
      return ['Full system access', 'User management', 'All donations', 'System settings']
    case 'manager':
      return ['Donation management', 'Analytics access', 'Report generation', 'Settings']
    case 'member':
      return ['Profile access', 'View activity', 'Basic dashboard']
    default:
      return ['Limited access']
  }
}

export default async function DashboardPage() {
  const session = await auth()

  /* (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600" />
      </div>
    )
  }*/

  if (!session) {
    redirect('/login')
  }

  const userRole = session.user?.role || 'member'
  const accessibleCards = dashboardCards.filter(card => 
    card.roles.includes(userRole)
  )

  

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
              <Badge className={getRoleColor(userRole)}>
                {userRole.toUpperCase()}
              </Badge>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                Welcome, {session.user?.name}
              </div>
              <Button
                variant="outline"
                size="sm"
                asChild
                className="text-red-600 hover:text-red-700"
              >
                <Link href="/api/auth/signout?callbackUrl=/login">
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid gap-6">
          {/* Welcome Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5 text-blue-600" />
                <span>Welcome to Your Dashboard</span>
              </CardTitle>
              <CardDescription>
                You are signed in as <strong>{session.user?.name}</strong> with{' '}
                <Badge className={getRoleColor(userRole)}>{userRole}</Badge> permissions.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Account Information</h4>
                  <div className="space-y-1 text-sm text-gray-600">
                    <p><strong>Email:</strong> {session.user?.email}</p>
                    <p><strong>Role:</strong> {userRole}</p>
                    <p><strong>User ID:</strong> {session.user?.id}</p>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Your Permissions</h4>
                  <ul className="space-y-1 text-sm text-gray-600">
                    {getRolePermissions(userRole).map((permission, index) => (
                      <li key={index} className="flex items-center space-x-2">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                        <span>{permission}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          <Separator />

          {/* Dashboard Cards */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Available Features
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {accessibleCards.map((card) => (
                <Link key={card.href} href={card.href}>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <card.icon className="h-5 w-5 text-blue-600" />
                        <span>{card.title}</span>
                      </CardTitle>
                      <CardDescription>{card.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex justify-between items-center">
                        <Badge variant="outline">
                          {card.roles.join(', ')}
                        </Badge>
                        {card.count && (
                          <span className="text-sm font-semibold text-gray-600">
                            {card.count}
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Quick Actions
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button variant="outline" className="h-16" asChild>
                <Link href="/dashboard/profile">
                  <User className="h-5 w-5 mr-2" />
                  Edit Profile
                </Link>
              </Button>
              
              {(userRole === 'admin' || userRole === 'manager') && (
                <Button variant="outline" className="h-16" asChild>
                  <Link href="/dashboard/donations">
                    <DollarSign className="h-5 w-5 mr-2" />
                    View Donations
                  </Link>
                </Button>
              )}
              
              <Button variant="outline" className="h-16" asChild>
                <Link href="/">
                  <Calendar className="h-5 w-5 mr-2" />
                  Back to Site
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}