"use client"

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { XataClient } from '@/xata'
import { useEffect, useState } from 'react'
import { DateRange } from 'react-day-picker'
import { addDays, format, subDays } from 'date-fns'
import { Calendar } from "@/components/ui/calendar"
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts'

const xata = new XataClient()

export default function ReportsPage() {
    const [dateRange, setDateRange] = useState<DateRange>({
        from: subDays(new Date(), 30),
        to: new Date()
    })
    const [reportData, setReportData] = useState<any[]>([])
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        fetchReportData()
    }, [dateRange])

    async function fetchReportData() {
        if (!dateRange.from || !dateRange.to) return

        setLoading(true)
        try {
            // Get donations by type
            const donationsByType = await xata.db.donations
                .filter({
                    $all: [
                        { "createdAt": { "$ge": dateRange.from.toISOString() } },
                        { "createdAt": { "$le": dateRange.to.toISOString() } }
                    ]
                })
                .summarize({
                    summaries: {
                        total: { sum: "amount" }
                    },
                    groups: [
                        {
                            columns: ["donationType"],
                            summaries: { total: { sum: "amount" } }
                        }
                    ]
                })

            // Get monthly trend
            const monthlyTrend = await xata.db.donations
                .filter({
                    $all: [
                        { "createdAt": { "$ge": subDays(dateRange.from, 90).toISOString() } },
                        { "createdAt": { "$le": dateRange.to.toISOString() } }
                    ]
                })
                .summarize({
                    summaries: {
                        total: { sum: "amount" }
                    },
                    groups: [
                        {
                            columns: [{
                                column: "createdAt",
                                compute: "truncate",
                                param: "month"
                            }],
                            summaries: { total: { sum: "amount" } }
                        }
                    ]
                })

            setReportData({
                byType: donationsByType.groups?.map(group => ({
                    name: group.donationType || 'Other',
                    value: group.summaries.total.sum || 0
                })) || [],
                monthlyTrend: monthlyTrend.groups?.map(group => ({
                    name: format(new Date(group.createdAt.truncate), 'MMM yyyy'),
                    amount: group.summaries.total.sum || 0
                })) || []
            })
        } catch (error) {
            console.error("Error fetching report data:", error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Date Range</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col md:flex-row gap-4">
                        <div>
                            <Calendar
                                mode="range"
                                selected={dateRange}
                                onSelect={setDateRange}
                                className="rounded-md border"
                            />
                        </div>
                        <div className="flex-1 space-y-4">
                            <h3 className="text-lg font-semibold">Donations by Type</h3>
                            {loading ? (
                                <div className="text-center py-8">Loading...</div>
                            ) : (
                                <div className="h-64">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={reportData.byType}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="name" />
                                            <YAxis />
                                            <Tooltip formatter={(value) => [`$${value}`, 'Amount']} />
                                            <Legend />
                                            <Bar dataKey="value" name="Amount" fill="#8884d8" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            )}

                            <h3 className="text-lg font-semibold">Monthly Trend</h3>
                            {loading ? (
                                <div className="text-center py-8">Loading...</div>
                            ) : (
                                <div className="h-64">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={reportData.monthlyTrend}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="name" />
                                            <YAxis />
                                            <Tooltip formatter={(value) => [`$${value}`, 'Amount']} />
                                            <Legend />
                                            <Bar dataKey="amount" name="Amount" fill="#82ca9d" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}