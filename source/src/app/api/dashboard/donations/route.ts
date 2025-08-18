import { NextResponse } from 'next/server';
import { connectMongoDB } from '@/lib/mongodb';
import Donation from '@/models/Donation';
import Donor from '@/models/Donor';

export async function GET() {
    try {
        await connectMongoDB();

        const donations = await Donation.find().lean();
        const donors = await Donor.find().lean();

        return NextResponse.json({ donations, donors });
    } catch (error) {
        console.error('Error fetching data:', error);
        return NextResponse.json(
            {
                error: 'Failed to fetch data',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}