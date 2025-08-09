'use client'

<<<<<<< Current (Your changes)
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Icons } from '@/components/dashboard/Icons';
import { Avatar } from '@/components/ui/avatar';
import { format, parseISO } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid, ResponsiveContainer } from 'recharts';
import { Line, LineChart, PieChart, Pie, Cell } from 'recharts';
import React, { useEffect, useState } from 'react';


const donationTypeColors = {
    general: '#4B5563',
    building: '#9CA3AF',
    missions: '#2563EB',
    offerings: '#F59E0B',
    tithe: '#10B981',
    special: '#8B5CF6',
    education: '#3B82F6',
    default: '#D1D5DB'
};

async function getDashboardData() {
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/dashboard`, {
        next: { revalidate: 3600 } // Revalidate every hour
    });

    if (!res.ok) {
        throw new Error('Failed to fetch dashboard data');
    }

    return res.json();
}


export default function DashboardPage() {
    const [dashboardData, setDashboardData] = useState<any>(null);
    const router = useRouter();
    const { data: session, status } = useSession();

    useEffect(() => {
        //if (status === 'loading') return; 

        /*if (status === 'unauthenticated') {
            router.push("/login");
            return;
        }*/

        // Fetch dashboard data
        const fetchData = async () => {
            try {
                const data = await getDashboardData();
                setDashboardData(data);
            } catch (error) {
                console.error('Error fetching dashboard data:', error);
            }
        };

        fetchData();
    }, [status, router]); // Re-run when session status changes

    if (status === "loading" || !dashboardData) {
        return <div>Loading...</div>;
    }

    if (status === "unauthenticated") {
        return <div>You are not authenticated. Redirecting...</div>;
    }

    if (session.user.role !== 'admin') {
        return (
            <div className="text-center text-red-500">
                You do not have the necessary permissions to view this page.
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Top Stats Row */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {/* Total Members */}
                <Card className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">Total Members</p>
                            <h3 className="text-2xl font-bold">{dashboardData.users.total.toLocaleString()}</h3>
                            <p className="text-sm text-green-600 mt-1">
                                +{dashboardData.users.newThisMonth} this month
                            </p>
                        </div>
                        <Icons.users className="h-6 w-6 text-church-primary" />
                    </div>
                </Card>

                {/* Total Donations */}
                <Card className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">Total Donations</p>
                            <h3 className="text-2xl font-bold">${dashboardData.donations.total.toLocaleString()}</h3>
                            <div className="flex items-center mt-1">
                                <span className="text-sm text-green-600">
                                    ${dashboardData.donations.currentMonth.toLocaleString()} ({dashboardData.donations.currentMonthPercentage}%)
                                </span>
                                <span className="text-xs text-muted-foreground ml-1">this month</span>
                            </div>
                        </div>
                        <Icons.donate className="h-6 w-6 text-church-primary" />
                    </div>
                </Card>

                {/* Donors */}
                <Card className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">Total Donors</p>
                            <h3 className="text-2xl font-bold">{dashboardData.donors.total.toLocaleString()}</h3>
                            <p className="text-sm text-green-600 mt-1">
                                +{dashboardData.donors.newThisMonth} new this month
                            </p>
                        </div>
                        <Icons.heart className="h-6 w-6 text-church-primary" />
                    </div>
                </Card>

                {/* Recurring Donations */}
                <Card className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">Recurring Donations</p>
                            <h3 className="text-2xl font-bold">{dashboardData.donations.recurring.toLocaleString()}</h3>
                            <p className="text-sm text-muted-foreground mt-1">
                                Steady support
                            </p>
                        </div>
                        <Icons.repeat className="h-6 w-6 text-church-primary" />
                    </div>
                </Card>
            </div>

            {/* Second Row */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {/* Upcoming Events */}
                <Card className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">Upcoming Events</p>
                            <h3 className="text-2xl font-bold">{dashboardData.events.upcoming}</h3>
                            {dashboardData.events.nextEvent && (
                                <p className="text-sm text-muted-foreground mt-1 truncate">
                                    Next: {dashboardData.events.nextEvent}
                                </p>
                            )}
                        </div>
                        <Icons.calendar className="h-6 w-6 text-church-primary" />
                    </div>
                </Card>

                {/* Appointments */}
                <Card className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">Upcoming Appointments</p>
                            <h3 className="text-2xl font-bold">{dashboardData.appointments.upcoming}</h3>
                            {dashboardData.appointments.nextAppointment && (
                                <p className="text-sm text-muted-foreground mt-1 truncate">
                                    Next: {dashboardData.appointments.nextAppointment.title}
                                </p>
                            )}
                        </div>
                        <Icons.calendarCheck className="h-6 w-6 text-church-primary" />
                    </div>
                </Card>

                {/* Messages */}
                <Card className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">Total Messages</p>
                            <h3 className="text-2xl font-bold">{dashboardData.messages.total.toLocaleString()}</h3>
                            <p className="text-sm text-muted-foreground mt-1">
                                Prayer requests & inquiries
                            </p>
                        </div>
                        <Icons.mail className="h-6 w-6 text-church-primary" />
                    </div>
                </Card>

                {/* Donation Progress */}
                <Card className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">Monthly Donation Progress</p>
                            <h3 className="text-2xl font-bold">${dashboardData.donations.currentMonth.toLocaleString()}</h3>
                            <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                                <div
                                    className="bg-church-primary h-2.5 rounded-full"
                                    style={{ width: `${Math.min(dashboardData.donations.currentMonthPercentage, 100)}%` }}
                                ></div>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                {dashboardData.donations.currentMonthPercentage}% of monthly goal
                            </p>
                        </div>
                        <Icons.trendingUp className="h-6 w-6 text-church-primary" />
                    </div>
                </Card>
            </div>

            {/* Charts Row */}
            <div className="grid gap-6 lg:grid-cols-3">
                {/* Donations by Type */}
                <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Donations by Type</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={dashboardData.donations.byType}
                                    dataKey="amount"
                                    nameKey="type"
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={80}
                                    label={({ type, percent }) => `${type} ${(percent * 100).toFixed(0)}%`}
                                >
                                    {dashboardData.donations.byType.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={donationTypeColors[entry.type] || donationTypeColors.default}
                                        />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value) => [`$${value}`, 'Amount']} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                {/* Donation Trends */}
                <Card className="p-6 lg:col-span-2">
                    <h3 className="text-lg font-semibold mb-4">Donation Trends (Last 6 Months)</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={dashboardData.charts.donationTrends}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" />
                                <YAxis />
                                <Tooltip formatter={(value) => [`$${value}`, 'Amount']} />
                                <Legend />
                                <Line
                                    type="monotone"
                                    dataKey="total"
                                    stroke="#8884d8"
                                    name="Total Donations"
                                    strokeWidth={2}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </Card>
            </div>

            {/* Donor Activity */}
            <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Donor Activity (Last 12 Months)</h3>
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={dashboardData.charts.donorActivity}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis yAxisId="left" orientation="left" />
                            <YAxis yAxisId="right" orientation="right" />
                            <Tooltip />
                            <Legend />
                            <Bar
                                yAxisId="left"
                                dataKey="newDonors"
                                name="New Donors"
                                fill="#82ca9d"
                            />
                            <Bar
                                yAxisId="right"
                                dataKey="totalDonations"
                                name="Total Donations ($)"
                                fill="#8884d8"
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </Card>

            {/* Recent Activity */}
            <div className="grid gap-6 lg:grid-cols-3">
                <Card className="p-6 lg:col-span-2">
                    <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
                    <div className="space-y-4">
                        <div className="flex items-start">
                            <div className="flex-shrink-0 bg-church-primary/10 p-2 rounded-full">
                                <Icons.donate className="h-4 w-4 text-church-primary" />
                            </div>
                            <div className="ml-3">
                                <p className="text-sm font-medium">
                                    {dashboardData.donors.newThisMonth} new donors this month
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    Total donors now at {dashboardData.donors.total}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-start">
                            <div className="flex-shrink-0 bg-church-primary/10 p-2 rounded-full">
                                <Icons.users className="h-4 w-4 text-church-primary" />
                            </div>
                            <div className="ml-3">
                                <p className="text-sm font-medium">
                                    {dashboardData.users.newThisMonth} new members joined
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    Total members now at {dashboardData.users.total}
                                </p>
                            </div>
                        </div>
                        {dashboardData.events.nextEvent && (
                            <div className="flex items-start">
                                <div className="flex-shrink-0 bg-church-primary/10 p-2 rounded-full">
                                    <Icons.calendar className="h-4 w-4 text-church-primary" />
                                </div>
                                <div className="ml-3">
                                    <p className="text-sm font-medium">
                                        Next event: {dashboardData.events.nextEvent}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        {dashboardData.events.upcoming} events coming up
                                    </p>
                                </div>
                            </div>
                        )}
                        {dashboardData.appointments.nextAppointment && (
                            <div className="flex items-start">
                                <div className="flex-shrink-0 bg-church-primary/10 p-2 rounded-full">
                                    <Icons.calendarCheck className="h-4 w-4 text-church-primary" />
                                </div>
                                <div className="ml-3">
                                    <p className="text-sm font-medium">
                                        Next appointment: {dashboardData.appointments.nextAppointment.title}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        {dashboardData.appointments.upcoming} appointments scheduled
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </Card>

                {/* Quick Actions */}
                <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
                    <div className="space-y-3">
                        <button className="w-full flex items-center justify-between px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                            <span>Add New Member</span>
                            <Icons.plus className="h-4 w-4" />
                        </button>
                        <button className="w-full flex items-center justify-between px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                            <span>Create Event</span>
                            <Icons.calendarPlus className="h-4 w-4" />
                        </button>
                        <button className="w-full flex items-center justify-between px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                            <span>Record Donation</span>
                            <Icons.donate className="h-4 w-4" />
                        </button>
                        <button className="w-full flex items-center justify-between px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                            <span>Generate Report</span>
                            <Icons.fileText className="h-4 w-4" />
                        </button>
                    </div>
                </Card>
            </div>
        </div>
    );
=======
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
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

export default function DashboardPage() {
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

  const userRole = session.user?.role || 'member'
  const accessibleCards = dashboardCards.filter(card => 
    card.roles.includes(userRole)
  )

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/auth/login' })
  }

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
                onClick={handleSignOut}
                className="text-red-600 hover:text-red-700"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
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
>>>>>>> Incoming (Background Agent changes)
}