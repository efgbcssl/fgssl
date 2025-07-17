export async function PUT(
    req: NextRequest,
    context: { params: { xata_id: string } }
) {
    try {
        const { xata_id } = context.params;
        const { status, remark } = await req.json();

        // Validate required fields
        if (!status) {
            return NextResponse.json(
                { error: 'Status is required', code: 'MISSING_STATUS' },
                { status: 400 }
            );
        }

        // First check if the record exists
        const existingRecord = await xata.db.appointments.read(xata_id);

        if (!existingRecord) {
            return NextResponse.json(
                { error: 'Appointment not found', code: 'NOT_FOUND' },
                { status: 404 }
            );
        }

        // Update the record
        const updated = await xata.db.appointments.update(xata_id, {
            status,
            ...(remark && { remark }), // Only include remark if provided
            updatedAt: new Date().toISOString() // Track when the update occurred
        });

        if (!updated) {
            throw new Error('Update operation failed');
        }

        return NextResponse.json({
            success: true,
            data: updated,
            message: 'Appointment updated successfully'
        });

    } catch (error) {
        console.error('Error updating appointment:', error);
        return NextResponse.json(
            {
                error: 'Failed to update appointment',
                code: 'SERVER_ERROR',
                ...(error instanceof Error && { details: error.message })
            },
            { status: 500 }
        );
    }
}