"use client"

import { useEffect, useState } from "react"
import { columns } from "@/components/dashboard/appointments/columns"
import { DataTable } from "@/components/dashboard/appointments/data-table"
import { Appointment } from "@/types/appointments"
import { FilterControls } from "@/components/dashboard/appointments/filter-controls"
import { ExportButtons } from "@/components/ui/export-buttons"
import { ErrorComponent } from "@/components/ui/error-component"
import { Button } from "@/components/ui/button"
import { SendRemindersButton } from "@/components/dashboard/appointments/send-reminder-button"
import { Calendar } from "lucide-react"

export default function AppointmentsPage() {
    const [appointments, setAppointments] = useState<Appointment[]>([])
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const [status, setStatus] = useState<string | null>(null)
    const [medium, setMedium] = useState<string | null>(null)
    const [createdDateRange, setCreatedDateRange] = useState<[Date, Date] | null>(null)
    const [preferredDateRange, setPreferredDateRange] = useState<[Date, Date] | null>(null)

    useEffect(() => {
        const fetchData = async () => {
            try {
                const queryParams = new URLSearchParams()
                if (status) queryParams.append('status', status)
                if (medium) queryParams.append('medium', medium)
                if (createdDateRange) {
                    queryParams.append('createdFrom', createdDateRange[0].toISOString())
                    queryParams.append('createdTo', createdDateRange[1].toISOString())
                }
                if (preferredDateRange) {
                    queryParams.append('preferredFrom', preferredDateRange[0].toISOString())
                    queryParams.append('preferredTo', preferredDateRange[1].toISOString())
                }

                const res = await fetch(`/api/appointments?${queryParams.toString()}`, {
                    method: 'GET',
                })

                if (!res.ok) {
                    const errorData = await res.json()
                    setError(errorData.error || 'Failed to load appointments.')
                } else {
                    const data = await res.json()
                    setAppointments(data)
                }
            } catch {
                setError('Failed to load appointments.')
            } finally {
                setIsLoading(false)
            }
        }

        fetchData()
    }, [status, medium, createdDateRange, preferredDateRange])


    if (error) {
        return (
            <ErrorComponent
                title="Fetch Error"
                message={error}
                retryLink="/dashboard/appointments"
            />
        )
    }

    return (
        <div className="container-custom py-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h2 className="text-2xl font-bold">Appointments</h2>
                    <p className="text-muted-foreground">Manage all upcoming and past appointments</p>
                </div>
                <ExportButtons data={appointments} filename="appointments_export" />
                <div className="flex gap-2">
                    <Button variant="outline">
                        <Calendar className="mr-2 h-4 w-4" />
                        Calendar View
                    </Button>
                    <SendRemindersButton />
                </div>
            </div>

            <FilterControls
                status={status}
                onStatusChange={setStatus}
                medium={medium}
                onMediumChange={setMedium}
                createdRange={createdDateRange}
                onCreatedRangeChange={setCreatedDateRange}
                preferredRange={preferredDateRange}
                onPreferredRangeChange={setPreferredDateRange}
            />

            <div className="bg-white rounded-lg border shadow-sm mt-4">
                <DataTable columns={columns} data={appointments} />
            </div>
        </div>
    )
}
