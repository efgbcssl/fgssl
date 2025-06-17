import { xata } from '@/lib/xata'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')

    // Validate date format (yyyy-mm-dd)
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return NextResponse.json(
            { error: 'Valid date parameter (yyyy-mm-dd) is required' },
            { status: 400 }
        )
    }

    try {
        const appointments = await xata.db.appointments
            .filter('preferredDate', { $startsWith: date })
            .getAll()

        // Handle case where preferredDate might be null/undefined
        const bookedTimes = appointments
            .filter(appt => appt.preferredDate)
            .map(appt => {
                const time = new Date(appt.preferredDate)
                return `${time.getHours().toString().padStart(2, '0')}:${time.getMinutes().toString().padStart(2, '0')}`
            })

        return NextResponse.json(bookedTimes, {
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-store' // or appropriate caching
            }
        })
    } catch (error: unknown) {
        console.error('Xata query failed:', error)
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        return NextResponse.json(
            { error: 'Failed to check availability', details: errorMessage },
            { status: 500 }
        )
    }
}