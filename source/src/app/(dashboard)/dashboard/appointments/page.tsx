"use client"

import { useEffect, useState, useCallback } from "react"
import { columns } from "@/components/dashboard/appointments/columns"
import { DataTable } from "@/components/dashboard/appointments/data-table"
import { Appointment } from "@/types/appointments"
import { FilterControls } from "@/components/dashboard/appointments/filter-controls"
import { ExportButtons } from "@/components/ui/export-buttons"
import { ErrorComponent } from "@/components/ui/error-component"
import { Button } from "@/components/ui/button"
import { SendRemindersButton } from "@/components/dashboard/appointments/send-reminder-button"
import { Calendar, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { subDays } from 'date-fns'

export default function AppointmentsPage() {
    const [appointments, setAppointments] = useState<Appointment[]>([])
    const [filteredAppointments, setFilteredAppointments] = useState<Appointment[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const { toast } = useToast()

    // Filter states
    const [status, setStatus] = useState<string | null>(null)
    const [medium, setMedium] = useState<string | null>(null)
    const [createdDateRange, setCreatedDateRange] = useState<[Date, Date] | null>(() => [
        subDays(new Date(), 30),
        new Date()
    ])
    const [preferredDateRange, setPreferredDateRange] = useState<[Date, Date] | null>(null)

    const fetchAppointments = useCallback(async () => {
        setIsLoading(true)
        setError(null)

        try {
            const params = new URLSearchParams()

            // Add filters if they exist
            if (status) params.append('status', status)
            if (medium) params.append('medium', medium)
            if (createdDateRange) {
                params.append('createdFrom', createdDateRange[0].toISOString())
                params.append('createdTo', createdDateRange[1].toISOString())
            }
            if (preferredDateRange) {
                params.append('preferredFrom', preferredDateRange[0].toISOString())
                params.append('preferredTo', preferredDateRange[1].toISOString())
            }

            const response = await fetch(`/api/appointments?${params.toString()}`)

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || 'Failed to fetch appointments')
            }

            const data = await response.json()
            setAppointments(data)
        } catch (err) {
            console.error('Failed to fetch appointments:', err)
            setError(err instanceof Error ? err.message : 'An unknown error occurred')
            toast({
                title: "Error",
                description: "Failed to load appointments",
                variant: "destructive"
            })
        } finally {
            setIsLoading(false)
        }
    }, [status, medium, createdDateRange, preferredDateRange, toast])

    // Initial fetch and refetch when filters change
    useEffect(() => {
        fetchAppointments()
    }, [fetchAppointments])

    // Refresh function that can be passed to child components
    useEffect(() => {
        if (!isLoading) { // Prevent double fetch on initial load
            fetchAppointments()
        }
    }, [status, medium, createdDateRange, preferredDateRange, toast])

    const refreshData = () => {
        fetchAppointments()
    }

    if (error) {
        return (
            <ErrorComponent
                title="Appointments Error"
                message={error}
                retryLink="/dashboard/appointments"
            />
        )
    }

    const clearAllFilters = () => {
        setStatus(null)
        setMedium(null)
        setCreatedDateRange([subDays(new Date(), 30), new Date()])
        setPreferredDateRange(null)
    }

    return (
        <div className="container-custom py-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h2 className="text-2xl font-bold">Appointments</h2>
                    <p className="text-muted-foreground">
                        {isLoading ? "Loading appointments..." : `Showing ${appointments.length} appointments`}
                    </p>
                </div>

                <div className="flex flex-wrap gap-2">
                    <ExportButtons
                        data={appointments}
                        filename="appointments_export"
                    />
                    <Button
                        variant="outline"
                        disabled={isLoading}
                        onClick={() => toast({
                            title: "Coming Soon",
                            description: "Calendar view will be available in the next update",
                        })}
                    >
                        {isLoading ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <Calendar className="mr-2 h-4 w-4" />
                        )}
                        Calendar View
                    </Button>
                    <SendRemindersButton
                    />
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
                disabled={isLoading}
                onClearAll={clearAllFilters}
                isLoading={isLoading}
            />

            <div className="bg-white rounded-lg border shadow-sm mt-4">
                {isLoading ? (
                    <div className="flex justify-center items-center h-64">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : (
                    <DataTable
                        columns={columns}
                        data={appointments}
                    />
                )}
            </div>
        </div>
    )
}