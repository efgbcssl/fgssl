import { NextResponse } from 'next/server'
import { xata } from '@/lib/xata'

export async function GET() {
    const donations = await xata.db.donations.getMany()
    return NextResponse.json(donations)
}

export async function POST(request: Request) {
    const data = await request.json()
    const donation = await xata.db.donations.create(data)
    return NextResponse.json(donation)
}