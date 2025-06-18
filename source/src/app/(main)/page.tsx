import HeroSlider from '@/components/home/HeroSlider'
import WeeklyMinistries from '@/components/home/WeeklyMinistries'
import EventBanner from '@/components/home/EventBanner'
import DonationSection from '@/components/home/DonationSection'
import AppointmentForm from '@/components/home/AppointmentForm'
import LatestVideos from '@/components/home/LatestVideos'
import FAQSection from '@/components/home/FAQSection'
import LiveStream from '@/components/home/LiveStream';

// Opt out of prerendering
export const dynamic = 'force-dynamic';

async function getEvents() {
    try {
        const apiUrl = process.env.NODE_ENV === 'production'
            ? `${process.env.NEXT_PUBLIC_SITE_URL}/api/events`
            : 'http://localhost:3000/api/events';

        const res = await fetch(apiUrl, {
            next: { revalidate: 60 },
            headers: {
                'Content-Type': 'application/json',
            },
            // Add timeout for the fetch request
            signal: AbortSignal.timeout(5000)
        });

        if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
        }

        return await res.json();
    } catch (error) {
        console.error('Error fetching events:', error);
        return []; // Fallback empty array
    }
}

export default async function Home() {
    let events = [];
    try {
        events = await getEvents();
    } catch (error) {
        console.error('Errorin Home component: ', error)
        events = [];
    }

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