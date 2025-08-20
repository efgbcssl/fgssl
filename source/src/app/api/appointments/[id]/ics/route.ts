/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextRequest, NextResponse } from 'next/server';
import { connectMongoDB } from '@/lib/mongodb';
import Appointment from '@/models/Appointment';
import { generateICS } from '@/utils/ics';

// Context type for this dynamic route
type RouteContext = {
    params: { id: string };
};

export async function GET(
    req: NextRequest,
    { params }: RouteContext
) {
    await connectMongoDB();

    const { id } = params;
    const appointment = await Appointment.findById(id).lean();

    if (!appointment) {
        return NextResponse.json(
            { error: 'Appointment not found' },
            { status: 404 }
        );
    }

    // Define a type for the expected appointment fields
    interface AppointmentFields {
        title: string;
        startUtcISO: string;
        fullName: string;
        email: string;
        preferredDate: string;
        preferredTime: string;
        medium: string;
        meetingLink: string;
        id?: string;
        _id?: string;
    }

    // Extract only the required fields
    const {
        title,
        startUtcISO,
        fullName,
        email,
        preferredDate,
        preferredTime,
        medium,
        meetingLink,
        _id,
    } = appointment as Record<string, unknown>;

    // Validate types
    if (
        typeof title !== 'string' ||
        typeof startUtcISO !== 'string' ||
        typeof fullName !== 'string' ||
        typeof email !== 'string' ||
        typeof preferredDate !== 'string' ||
        typeof preferredTime !== 'string' ||
        typeof medium !== 'string' ||
        typeof meetingLink !== 'string'
    ) {
        return NextResponse.json(
            { error: 'Invalid appointment data' },
            { status: 500 }
        );
    }

    const typedAppointment: AppointmentFields = {
        title,
        startUtcISO,
        fullName,
        email,
        preferredDate,
        preferredTime,
        medium,
        meetingLink,
        id: (appointment as any).id ?? undefined,
        _id: (appointment as any)._id?.toString?.() ?? undefined,
    };

    const icsContent = generateICS({
        title: typedAppointment.title,
        startUtcISO: typedAppointment.startUtcISO,
    });

    return new NextResponse(icsContent, {
        headers: {
            'Content-Type': 'text/calendar; charset=utf-8',
            'Content-Disposition': `attachment; filename=appointment-${typedAppointment.id ?? typedAppointment._id
                }.ics`,
        },
    });
}
