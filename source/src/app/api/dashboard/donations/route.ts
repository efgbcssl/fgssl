import { NextResponse } from 'next/server'
import { xata } from '@/lib/xata'

export async function GET() {

    const donations = await xata.db.donations.getMany()
    const donors = await xata.db.donors.getMany()

    return NextResponse.json({ donations, donors })
}
