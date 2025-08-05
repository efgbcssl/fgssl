import type { Metadata } from 'next';
import { Inter, Montserrat } from 'next/font/google';
import '@/styles/globals.css';
import { cn } from '@/lib/utils';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { Navbar } from '@/components/dashboard/NavBar';

const inter = Inter({ subsets: ['latin'], variable: '--font-body' });
const montserrat = Montserrat({ subsets: ['latin'], variable: '--font-heading' });

export const metadata: Metadata = {
    title: 'Church Dashboard',
    description: 'Administrative dashboard for church management',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body className={cn(
                "min-h-screen bg-background font-sans antialiased",
                inter.variable,
                montserrat.variable
            )}>
                <div className="flex h-screen overflow-hidden">
                    <DashboardLayout>
                        {children}
                    </DashboardLayout>
                </div>
            </body>
        </html>
    );
}

function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <>
            <Sidebar />
            <div className="flex flex-col flex-1 overflow-hidden">
                <Navbar />
                <main className="flex-1 overflow-y-auto p-6">
                    {children}
                </main>
            </div>
            
            {/* Add mobile sidebar toggle functionality */}
            <Sidebar className="hidden md:block" />
            <div className="flex flex-col flex-1 overflow-hidden">
                <Navbar className="md:hidden" /> {/* Example: show only on mobile */}
                <main className="flex-1 overflow-y-auto p-4 md:p-6">
                    {children}
                </main>
            </div>
        </>
    );
}