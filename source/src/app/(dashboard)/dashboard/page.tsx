'use client'

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
}