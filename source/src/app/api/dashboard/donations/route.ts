import { NextResponse } from 'next/server';
import { xata } from '@/lib/xata';

export async function GET() {
    try {
        const donations = await xata.db.donations.getAll();
        return NextResponse.json(donations);
    } catch {
        return NextResponse.json(
            { error: 'Failed to fetch donations' },
            { status: 500 }
        );
    }
}
