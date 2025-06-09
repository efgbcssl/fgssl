import { DataTable } from '@/components/dashboard/appointments/data-table'
import { columns } from '@/components/dashboard/appointments/columns'
import { xata } from '@/lib/xata'
import { Button } from '@/components/ui/button'
import { Calendar } from 'lucide-react'
import { SendRemindersButton } from '@/components/dashboard/appointments/send-reminder-button'
import { ErrorComponent } from '@/components/ui/error-component'

export default async function AppointmentsPage() {
    try {

        const appointments = await xata.db.appointments
            .sort('preferredDate', 'desc')
            .getAll()
            .catch(error => {
                console.error('Error fetching appointments:', error)
                throw error
            })

        return (
            <div className="container-custom py-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <h2 className="text-2xl font-bold">Appointments</h2>
                        <p className="text-muted-foreground">
                            Manage all upcoming and past appointments
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline">
                            <Calendar className="mr-2 h-4 w-4" />
                            Calendar View
                        </Button>
                        <SendRemindersButton />
                    </div>
                </div>

                <div className="bg-white rounded-lg border shadow-sm">
                    <DataTable columns={columns} data={appointments} />
                </div>
            </div>
        )
    } catch (error) {
        return <ErrorComponent
            title="Failed to load appointments"
            message="There was an error fetching the appointments. Please try again later."
            retryLink="/dashboard/appointments"
        />
    }
}
