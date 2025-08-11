import { redirect } from 'next/navigation'

export function GET() {
    redirect('/auth/login')
}