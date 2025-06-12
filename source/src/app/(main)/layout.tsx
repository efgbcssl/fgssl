import type { Metadata } from 'next';
import { Inter, Montserrat } from 'next/font/google';
import '../../styles/globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import Navbar from '@/components/layouts/Navbar';
import Footer from '@/components/layouts/Footer';
import { Toaster } from '@/components/ui/toaster';


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
            <head>
                <script
                    src="https://www.youtube.com/iframe_api"
                    async
                    defer
                />
                <link rel="preconnect" href="https://www.youtube.com" />
                <link rel="preconnect" href="https://i.ytimg.com" />
            </head>
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
                            <Toaster />
                        </main>
                        <Footer />
                    </div>
                </ThemeProvider>
            </body>
        </html>
    );
}