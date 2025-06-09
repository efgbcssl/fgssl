import type { Metadata } from 'next';
import { Inter, Montserrat } from 'next/font/google';
import '../../styles/globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import Navbar from '@/components/layouts/Navbar';
import Footer from '@/components/layouts/Footer';


const inter = Inter({
    subsets: ['latin'],
    variable: '--font-inter',
});

const montserrat = Montserrat({
    subsets: ['latin'],
    variable: '--font-montserrat',
    display: 'swap',
});

export const metadata: Metadata = {
    title: 'Ethiopian Full Gospel Believers Church (EFGBC) Silver Spring Local',
    description: 'Transforming lives through faith, hope and love',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body className={`${inter.variable} ${montserrat.variable} font-sans`}>
                <ThemeProvider
                    attribute="class"
                    defaultTheme="light"
                    enableSystem={false}
                    disableTransitionOnChange
                >
                    <div className="flex min-h-screen flex-col">
                        <Navbar />
                        <main className="flex-1">
                            {children}
                        </main>
                        <Footer />
                    </div>
                </ThemeProvider>
            </body>
        </html>
    );
}