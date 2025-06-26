import { NextRequest, NextResponse } from 'next/server'
import { xata } from '@/lib/xata'

export async function PUT(
    req: NextRequest,
    context: { params: Promise<{ phoneNumber: string }> }
) {
    try {
        const { phoneNumber } = await context.params
        const { status, remark } = await req.json()

        const record = await xata.db.appointments
            .filter({ phoneNumber })
            .getFirst()

        if (!record) {
            return NextResponse.json({ error: 'Appointment not found' }, { status: 404 })
        }

        const updated = await xata.db.appointments.update(record.xata_id, {
            status,
            remark,
        })

        return NextResponse.json(updated)
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: 'Failed to update appointment' }, { status: 500 })
    }
}