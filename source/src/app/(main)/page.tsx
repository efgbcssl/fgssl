import HeroSlider from '@/components/home/HeroSlider'
import WeeklyMinistries from '@/components/home/WeeklyMinistries'
import EventBanner from '@/components/home/EventBanner'
import DonationSection from '@/components/home/DonationSection'
import AppointmentForm from '@/components/home/AppointmentForm'
import LatestVideos from '@/components/home/LatestVideos'
import FAQSection from '@/components/home/FAQSection'
import LiveStream from '../../components/home/LiveStream';

async function getEvents() {
    const baseUrl =
        process.env.NODE_ENV === 'development'
            ? 'http://localhost:3000'
            : process.env.NEXT_PUBLIC_SITE_URL;

    const res = await fetch(`${baseUrl}/api/events`, {
        next: { revalidate: 60 },
    });

    if (!res.ok) throw new Error('Failed to fetch events');
    return res.json();
}


export default async function Home() {
    const events = await getEvents();
    return (
        <>
            <HeroSlider />
            <DonationSection />
            <LiveStream />
            <EventBanner events={events} />
            <WeeklyMinistries />
            <LatestVideos />
            <AppointmentForm />

            <FAQSection />

        </>
    );
}