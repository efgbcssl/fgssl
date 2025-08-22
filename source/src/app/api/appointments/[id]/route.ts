import { NextResponse } from 'next/server';
import { connectMongoDB } from '@/lib/mongodb';
import Appointment from '@/models/Appointment';

export async function GET(
    req: Request,
    context: { params: { id: string } }
) {
    try {
        await connectMongoDB();
        const { id } = context.params;

        const appointment = await Appointment.findById(id);
        if (!appointment) {
            return NextResponse.json(
                { error: 'Appointment not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(appointment);
    } catch (error) {
        console.error('Error fetching appointment:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function PATCH(
    req: Request,
    { params }: { params: { id: string } }
) {
    await connectMongoDB();
    const data = await req.json();
    const updated = await Appointment.findByIdAndUpdate(
        params.id,
        { ...data, updatedAt: new Date().toISOString() },
        { new: true }
    );
    if (!updated) {
        return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }
    return NextResponse.json(updated);
}

export async function DELETE(
    _req: Request,
    { params }: { params: { id: string } }
) {
    await connectMongoDB();
    const deleted = await Appointment.findByIdAndDelete(params.id);
    if (!deleted) {
        return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true });
}