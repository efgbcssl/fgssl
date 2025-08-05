import type { Metadata } from 'next';
import { Inter, Montserrat } from 'next/font/google';
import '@/styles/globals.css';
import { cn } from '@/lib/utils';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { Navbar } from '@/components/dashboard/NavBar';
import { SessionProvider } from 'next-auth/react';

const inter = Inter({ subsets: ['latin'], variable: '--font-body' });
const montserrat = Montserrat({ subsets: ['latin'], variable: '--font-heading' });

export const metadata: Metadata = {
    title: 'Church Dashboard',
    description: 'Administrative dashboard for church management',
};

export default async function RootLayout({
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
                <SessionProvider>
                    <div className="flex h-screen overflow-hidden">
                        <DashboardLayout>
                            {children}
                        </DashboardLayout>
                    </div>
                </SessionProvider>
            </body>
        </html>
    );
}

function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <>
            {/* Desktop Sidebar - always visible on md+ screens */}
            <Sidebar className="hidden md:block" />
            
            {/* Mobile Sidebar - would need toggle functionality */}
            {/* <Sidebar className="md:hidden" /> */}
            
            <div className="flex flex-col flex-1 overflow-hidden">
                {/* Single Navbar instance */}
                <Navbar />
                
                {/* Single Main content area */}
                <main className="flex-1 overflow-y-auto p-4 md:p-6">
                    {children}
                </main>
            </div>
        </>
    );
}