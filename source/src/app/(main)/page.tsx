import HeroSlider from '@/components/home/HeroSlider'
import WeeklyMinistries from '@/components/home/WeeklyMinistries'
import EventBanner from '@/components/home/EventBanner'
import DonationSection from '@/components/home/DonationSection'
import AppointmentForm from '@/components/home/AppointmentForm'
import LatestVideos from '@/components/home/LatestVideos'
import FAQSection from '@/components/home/FAQSection'
import LiveStream from '../../components/home/LiveStream';

// Opt out of prerendering
export const dynamic = 'force-dynamic';

async function getEvents() {
    try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/events`, {
            next: { revalidate: 60 },
        });
        return res.ok ? res.json() : []; // Return empty array if fetch fails
    } catch (error) {
        console.error('Error fetching events:', error);
        return []; // Fallback empty array
    }
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