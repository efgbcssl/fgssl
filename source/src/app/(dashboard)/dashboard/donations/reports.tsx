// app/(dashboard)/dashboard/donations/report.tsx
'use client'

import { useEffect, useState } from 'react'
import { getAllDonations } from '@/lib/donations'
import { Donation } from '@/types/donations'

export default function DonationReportPage() {
    const [donations, setDonations] = useState<Donation[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchData = async () => {
            try {
                const data = await getAllDonations()
                setDonations(data)
            } catch (err) {
                console.error('Error fetching donations:', err)
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [])

    if (loading) {
        return <p className="p-4">Loading donations...</p>
    }

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">Donation Reports</h1>
            <div className="grid gap-4">
                {donations.map((donation) => (
                    <div key={donation.id} className="p-4 border rounded">
                        <p><strong>Donor:</strong> {donation.donorName} ({donation.donorEmail})</p>
                        <p><strong>Amount:</strong> ${donation.amount.toFixed(2)} ({donation.currency})</p>
                        <p><strong>Type:</strong> {donation.donationType}</p>
                        <p><strong>Status:</strong> {donation.paymentStatus}</p>
                        <p><strong>Date:</strong> {new Date(donation.createdAt).toLocaleString()}</p>
                    </div>
                ))}
            </div>
        </div>
    )
}
