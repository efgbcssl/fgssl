import { NextResponse } from 'next/server'
import { xata } from '@/lib/xata'

export async function GET() {

    const donations = await xata.db.donations.getAll()
    const donors = await xata.db.donors.getAll()

    return NextResponse.json({ donations, donors })
}
