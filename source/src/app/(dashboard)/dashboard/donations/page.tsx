import { DonationChart, RecentDonations } from './components'
import { getDonationSummary } from '@/lib/actions/donations'

export default async function DonationsPage() {
    const { totalAmount, monthlyTrend } = await getDonationSummary()

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold">Donations Dashboard</h1>
            <DonationChart data={monthlyTrend} />
            <RecentDonations />
        </div>
    )
}