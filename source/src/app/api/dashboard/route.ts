import { NextResponse } from 'next/server';
import { xata } from '@/lib/xata';

export async function GET() {
    try {
        // Current date calculations
        const now = new Date();
        const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

        // Fetch all data in parallel for better performance
        const [
            totalDonations,
            currentMonthDonations,
            totalDonors,
            newDonorsThisMonth,
            upcomingEvents,
            totalMessages,
            totalUsers,
            newUsersThisMonth,
            upcomingAppointments,
            recurringDonations,
            donationsByType
        ] = await Promise.all([
            // Total donations
            xata.db.donations.aggregate({
                totalAmount: { sum: 'amount' }
            }),
            
            // Current month donations
            xata.db.donations.aggregate({
                totalAmount: { sum: 'amount' },
                filter: {
                    date: {
                        $ge: currentMonthStart.toISOString(),
                        $lt: nextMonthStart.toISOString()
                    }
                }
            }),
            
            // Total donors
            xata.db.donors.count(),
            
            // New donors this month
            xata.db.donors.count({
                filter: {
                    createdAt: {
                        $ge: currentMonthStart.toISOString()
                    }
                }
            }),
            
            // Upcoming events (next 30 days)
            xata.db.events
                .filter({
                    date: {
                        $ge: now.toISOString(),
                        $le: thirtyDaysFromNow.toISOString()
                    }
                })
                .sort('date', 'asc')
                .getMany(),
            
            // Total messages
            xata.db.messages.count(),
            
            // Total users
            xata.db.users.count(),
            
            // New users this month
            xata.db.users.count({
                filter: {
                    createdAt: {
                        $ge: currentMonthStart.toISOString()
                    }
                }
            }),
            
            // Upcoming appointments (next 7 days)
            xata.db.appointments
                .filter({
                    date: {
                        $ge: now.toISOString(),
                        $le: sevenDaysFromNow.toISOString()
                    }
                })
                .sort('date', 'asc')
                .getMany(),
            
            // Recurring donations
            xata.db.donations.count({
                filter: {
                    isRecurring: true
                }
            }),
            
            // Donations by type
            xata.db.donations.aggregate({
                summaries: {
                    groupBy: ['donationType'],
                    columns: ['amount'],
                    summaries: {
                        amount: { sum: 'amount' }
                    }
                }
            })
        ]);

        // Calculate percentages and prepare data
        const currentMonthPercentage = totalDonations.aggs.totalAmount 
            ? Math.round((currentMonthDonations.aggs.totalAmount / totalDonations.aggs.totalAmount) * 100)
            : 0;

        // Prepare donation type data for charts
        const donationTypeData = donationsByType.aggs.summaries?.map(summary => ({
            type: summary.group.donationType,
            amount: summary.summaries.amount,
            count: summary.count
        })) || [];

        return NextResponse.json({
            success: true,
            data: {
                donations: {
                    total: totalDonations.aggs.totalAmount || 0,
                    currentMonth: currentMonthDonations.aggs.totalAmount || 0,
                    currentMonthPercentage,
                    recurring: recurringDonations,
                    byType: donationTypeData
                },
                donors: {
                    total: totalDonors,
                    newThisMonth: newDonorsThisMonth
                },
                events: {
                    upcoming: upcomingEvents.length,
                    nextEvent: upcomingEvents[0]?.name || null,
                    nextEventDate: upcomingEvents[0]?.date || null
                },
                messages: {
                    total: totalMessages
                },
                users: {
                    total: totalUsers,
                    newThisMonth: newUsersThisMonth
                },
                appointments: {
                    upcoming: upcomingAppointments.length,
                    nextAppointment: upcomingAppointments[0] 
                        ? {
                            title: upcomingAppointments[0].title,
                            date: upcomingAppointments[0].date
                        } 
                        : null
                },
                // Additional data for charts
                charts: {
                    donationTrends: await getDonationTrendsData(),
                    donorActivity: await getDonorActivityData()
                }
            }
        });
    } catch (error) {
        console.error('Dashboard API error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch dashboard data' },
            { status: 500 }
        );
    }
}

// Helper function to get donation trends data
async function getDonationTrendsData() {
    const now = new Date();
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(now.getMonth() - 6);

    const results = await xata.db.donations
        .select(['amount', 'date', 'donationType'])
        .filter({
            date: {
                $ge: sixMonthsAgo.toISOString()
            }
        })
        .sort('date', 'asc')
        .getAll();

    // Group by month and type
    const monthlyData: Record<string, any> = {};

    results.forEach(donation => {
        if (!donation.date) return;
        
        const date = new Date(donation.date);
        const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        if (!monthlyData[monthYear]) {
            monthlyData[monthYear] = {
                date: monthYear,
                total: 0
            };
        }

        monthlyData[monthYear].total += donation.amount || 0;
    });

    return Object.values(monthlyData);
}

// Helper function to get donor activity data
async function getDonorActivityData() {
    const now = new Date();
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(now.getMonth() - 12);

    const results = await xata.db.donors
        .select(['createdAt', 'totalDonation'])
        .filter({
            createdAt: {
                $ge: twelveMonthsAgo.toISOString()
            }
        })
        .sort('createdAt', 'asc')
        .getAll();

    // Group by month
    const monthlyData: Record<string, any> = {};

    results.forEach(donor => {
        if (!donor.createdAt) return;
        
        const date = new Date(donor.createdAt);
        const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        if (!monthlyData[monthYear]) {
            monthlyData[monthYear] = {
                date: monthYear,
                newDonors: 0,
                totalDonations: 0
            };
        }

        monthlyData[monthYear].newDonors += 1;
        monthlyData[monthYear].totalDonations += donor.totalDonation || 0;
    });

    return Object.values(monthlyData);
}