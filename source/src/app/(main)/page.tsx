import HeroSlider from '@/components/home/HeroSlider'
import WeeklyMinistries from '@/components/home/WeeklyMinistries'
import EventBanner from '@/components/home/EventBanner'
import DonationSection from '@/components/home/DonationSection'
import AppointmentForm from '@/components/home/AppointmentForm'
import LatestVideos from '@/components/home/LatestVideos'
import FAQSection from '@/components/home/FAQSection'
import LiveStream from '../../components/home/LiveStream';

async function getEvents() {
    const res = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/events`, {
        next: { revalidate: 60 }, // Revalidate every 60 seconds
    })

    if (!res.ok) throw new Error('Failed to fetch events')
    return res.json()
}

export default async function Home() {
    const events = await getEvents();
    return (
        <>
            <HeroSlider />
            <WeeklyMinistries />
            <EventBanner events={events} />
            <DonationSection />
            <LiveStream />
            <AppointmentForm />
            <LatestVideos />
            <FAQSection />
        </>
    );
}