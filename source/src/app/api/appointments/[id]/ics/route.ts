import { NextResponse } from 'next/server';
import { connectMongoDB } from '@/lib/mongodb';
import Appointment from '@/models/Appointment';
import { generateICS } from '@/utils/ics';

export async function GET(
    _req: Request,
    { params }: { params: { id: string } }
) {
    await connectMongoDB();
    const appointment = await Appointment.findById(params.id);
    if (!appointment) {
        return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }

    const icsContent = generateICS({
        id: appointment.id,
        title: appointment.title,
        startUtcISO: appointment.startUtcISO,
        fullName: appointment.fullName,
        email: appointment.email,
        preferredDate: appointment.preferredDate,
        preferredTime: appointment.preferredTime,
        medium: appointment.medium,
        meetingLink: appointment.meetingLink
    });
    return new NextResponse(icsContent, {
        headers: {
            'Content-Type': 'text/calendar; charset=utf-8',
            'Content-Disposition': `attachment; filename=appointment-${appointment.id}.ics`,
        },
    });
}
