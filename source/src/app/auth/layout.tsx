import type { Metadata } from 'next';
import { Inter, Montserrat } from 'next/font/google';
import '../../styles/globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/toaster';
import SessionProviderWrapper from '@/components/providers/session-provider';

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
    title: 'Authentication - EFGBC Silver Spring',
    description: 'Sign in to your account',
};

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body className={`${inter.variable} ${montserrat.variable} font-sans`}>
                <SessionProviderWrapper>
                    <ThemeProvider
                        attribute="class"
                        defaultTheme="light"
                        enableSystem={false}
                        disableTransitionOnChange
                    >
                        {children}
                        <Toaster />
                    </ThemeProvider>
                </SessionProviderWrapper>
            </body>
        </html>
    );
}
