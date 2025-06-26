'use client'

import { useEffect, useState, useMemo } from 'react'
import axios from 'axios'
import {
    BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
    XAxis, YAxis, Tooltip, Legend, CartesianGrid, ResponsiveContainer
} from 'recharts'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { format, isAfter, isBefore } from 'date-fns'
import { CSVLink } from 'react-csv'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'

interface Donation {
    amount: number
    currency: string
    donationType: string
    donorEmail: string
    donorName: string
    donorPhone: string
    isRecurring: boolean
    notes: string
    paymentMethod: string
    paymentStatus: string
    receiptUrl: string
    stripeChargedId: string
    stripePaymentIntentId: string
    xata_createdat: string
}

interface Donor {
    email: string
    phone: string
    totalDonation: number
    lastDonationDate: string
}

const donationTypeColors: Record<string, string> = {
    general: '#4B5563',         // Neutral gray - for general use
    building: '#9CA3AF',        // Cement-gray tone - for infrastructure/building
    missions: '#2563EB',        // Deep blue - symbolic of outreach/global efforts
    offerings: '#F59E0B',       // Golden yellow - giving/offering
    tithe: '#10B981',           // Green - growth, firstfruits
    special: '#8B5CF6',         // Purple - distinction, uniqueness
    education: '#3B82F6',       // Sky blue - clarity, learning
    default: '#D1D5DB'          // Soft neutral gray - fallback
}


export default function DonationsDashboard() {
    const [donations, setDonations] = useState<Donation[]>([])
    const [donors, setDonors] = useState<Donor[]>([])
    const [filter, setFilter] = useState('')
    const [selectedType, setSelectedType] = useState<string | null>(null)
    const [dateRange, setDateRange] = useState({ from: '', to: '' })
    const [currentPage, setCurrentPage] = useState(1)
    const [hasMounted, setHasMounted] = useState(false)
    const itemsPerPage = 20

    useEffect(() => {
        setHasMounted(true)
        const fetchData = async () => {
            try {
                const res = await axios.get<{ donations: Donation[]; donors: Donor[] }>('/api/dashboard/donations')
                setDonations(res.data.donations)
                setDonors(res.data.donors)
            } catch (err) {
                console.error('Failed to fetch donations data:', err)
            }
        }
        fetchData()
    }, [])

    const filteredDonations = useMemo(() => {
        return donations.filter(d => {
            const matchesSearch =
                d.donorName?.toLowerCase().includes(filter.toLowerCase()) ||
                d.donorEmail?.toLowerCase().includes(filter.toLowerCase())

            const matchesType = selectedType ? d.donationType === selectedType : true

            const matchesDate = (!dateRange.from || isAfter(new Date(d.xata_createdat), new Date(dateRange.from))) &&
                (!dateRange.to || isBefore(new Date(d.xata_createdat), new Date(dateRange.to)))

            return matchesSearch && matchesType && matchesDate
        })
    }, [donations, filter, selectedType, dateRange])

    const paginatedDonations = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage
        return filteredDonations.slice(start, start + itemsPerPage)
    }, [filteredDonations, currentPage])

    const totalPages = Math.ceil(filteredDonations.length / itemsPerPage)

    const totalDonations = filteredDonations.reduce((sum, d) => sum + d.amount, 0)

    const donationsByType = filteredDonations.reduce((acc: { [key: string]: number }, curr) => {
        acc[curr.donationType] = (acc[curr.donationType] || 0) + curr.amount
        return acc
    }, {})

    const donationPieData = Object.entries(donationsByType).map(([type, amount]) => ({
        name: type,
        value: amount
    }))

    const donationLineData = filteredDonations.map(d => ({
        date: format(new Date(d.xata_createdat), 'yyyy-MM-dd'),
        amount: d.amount
    }))

    const donationBarData = Object.values(
        filteredDonations.reduce((acc: { [date: string]: { date: string; total: number } }, d) => {
            const date = format(new Date(d.xata_createdat), 'yyyy-MM-dd')
            acc[date] = acc[date] || { date, total: 0 }
            acc[date].total += d.amount
            return acc
        }, {})
    )

    const handleExcelExport = () => {
        const worksheet = XLSX.utils.json_to_sheet(filteredDonations)
        const workbook = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Donations')
        XLSX.writeFile(workbook, 'donations_report.xlsx')
    }

    const handlePDFExport = () => {
        const doc = new jsPDF()
        autoTable(doc, {
            head: [['Date', 'Name', 'Email', 'Phone', 'Amount', 'Type', 'Status']],
            body: filteredDonations.map(d => [
                format(new Date(d.xata_createdat), 'yyyy-MM-dd'),
                d.donorName,
                d.donorEmail,
                d.donorPhone,
                `$${d.amount}`,
                d.donationType,
                d.paymentStatus
            ])
        })
        doc.save('donations_report.pdf')
    }

    if (!hasMounted) return null

    return (
        <div className="p-8 space-y-6">
            <h1 className="text-2xl font-bold">Donations Dashboard</h1>

            <div className="flex flex-wrap gap-2 items-center">
                <Input placeholder="Filter by donor name or email" value={filter} onChange={(e) => setFilter(e.target.value)} />
                <Input type="date" value={dateRange.from} onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))} />
                <Input type="date" value={dateRange.to} onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))} />
                {hasMounted && (
                    <>
                        <CSVLink
                            data={filteredDonations}
                            headers={[
                                { label: 'Name', key: 'donorName' },
                                { label: 'Email', key: 'donorEmail' },
                                { label: 'Phone', key: 'donorPhone' },
                                { label: 'Amount', key: 'amount' },
                                { label: 'Type', key: 'donationType' },
                                { label: 'Status', key: 'paymentStatus' },
                                { label: 'Date', key: 'xata_createdat' }
                            ]}
                            filename="donations_report.csv"
                            className="bg-gray-700 text-white px-3 py-1 rounded"
                        >
                            CSV
                        </CSVLink>
                        <button onClick={handleExcelExport} className="bg-green-700 text-white px-3 py-1 rounded">Excel</button>
                        <button onClick={handlePDFExport} className="bg-red-700 text-white px-3 py-1 rounded">PDF</button>
                    </>
                )}
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                <Card><CardContent><h2>Total Donations</h2><p className="text-lg">${totalDonations.toLocaleString()}</p></CardContent></Card>
                <Card><CardContent><h2>Total Donors</h2><p className="text-lg">{donors.length}</p></CardContent></Card>
                <Card><CardContent><h2>Recurring Donations</h2><p className="text-lg">{filteredDonations.filter(d => d.isRecurring).length}</p></CardContent></Card>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card><CardContent>
                    <h2>Donations by Type</h2>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={donationPieData}
                                dataKey="value"
                                nameKey="name"
                                cx="50%" cy="50%"
                                outerRadius={100}
                                onClick={(data) => setSelectedType(data.name === selectedType ? null : data.name)}
                                label={({ name, percent }) => percent > 0.05 ? `${name} ${(percent * 100).toFixed(1)}%` : ''}
                            >
                                {donationPieData.map((entry, index) => (
                                    <Cell key={index} fill={donationTypeColors[entry.name] || donationTypeColors.default}
                                        stroke={entry.name === selectedType ? '#000' : undefined}
                                        strokeWidth={entry.name === selectedType ? 2 : 1}
                                        cursor="pointer"
                                    />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend verticalAlign="bottom" align="right" layout="vertical" />
                        </PieChart>
                    </ResponsiveContainer>
                    {selectedType && (
                        <button onClick={() => setSelectedType(null)} className="mt-2 text-sm text-blue-600 underline">Reset Filter</button>
                    )}
                </CardContent></Card>

                <Card><CardContent>
                    <h2>Donations Over Time</h2>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={donationLineData}>
                            <XAxis dataKey="date" />
                            <YAxis />
                            <CartesianGrid strokeDasharray="3 3" />
                            <Tooltip />
                            <Legend />
                            <Line type="monotone" dataKey="amount" stroke="#8884d8" />
                        </LineChart>
                    </ResponsiveContainer>
                </CardContent></Card>
            </div>

            <Card><CardContent>
                <h2>Daily Totals</h2>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={donationBarData}>
                        <XAxis dataKey="date" />
                        <YAxis />
                        <CartesianGrid strokeDasharray="3 3" />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="total" fill="#82ca9d" />
                    </BarChart>
                </ResponsiveContainer>
            </CardContent></Card>

            {/* Table */}
            <Card><CardContent>
                <h2>All Donations</h2>
                <div className="overflow-auto">
                    <table className="min-w-full text-sm text-left">
                        <thead><tr>
                            <th>Date</th><th>Name</th><th>Email</th><th>Phone</th>
                            <th>Amount</th><th>Type</th><th>Status</th>
                        </tr></thead>
                        <tbody>
                            {paginatedDonations.map((d, i) => (
                                <tr key={i} className="border-t">
                                    <td>{format(new Date(d.xata_createdat), 'yyyy-MM-dd')}</td>
                                    <td>{d.donorName}</td>
                                    <td>{d.donorEmail}</td>
                                    <td>{d.donorPhone}</td>
                                    <td>${d.amount}</td>
                                    <td>{d.donationType}</td>
                                    <td>{d.paymentStatus}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="mt-4 flex gap-4 items-center">
                    <button onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1} className="px-2 py-1 bg-gray-200">Prev</button>
                    <span>Page {currentPage} of {totalPages}</span>
                    <button onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages} className="px-2 py-1 bg-gray-200">Next</button>
                </div>
            </CardContent></Card>
        </div>
    )
}
