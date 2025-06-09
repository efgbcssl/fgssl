import type { Config } from 'tailwindcss';
import defaultTheme from 'tailwindcss/defaultTheme';
import forms from '@tailwindcss/forms';
import typography from '@tailwindcss/typography';
import animate from 'tailwindcss-animate';

const config: Config = {
    darkMode: 'class',
    content: [
        './src/**/*.{ts,tsx,js,jsx,mdx}',
        './src/app/**/*.{ts,tsx,js,jsx,mdx}',
        './src/components/**/*.{ts,tsx,js,jsx,mdx}',
    ],
    theme: {
        container: {
            center: true,
            padding: '2rem',
            screens: {
                '2xl': '1400px',
            },
        },
        extend: {
            fontFamily: {
                heading: ['var(--font-montserrat)', ...defaultTheme.fontFamily.sans],
                sans: ['var(--font-inter)', ...defaultTheme.fontFamily.sans],
            },
            colors: {
                // Church theme colors
                church: {
                    primary: '#2a3990',    // Deep royal blue
                    secondary: '#e6b655',  // Gold
                    light: '#f8f9fa',      // Light background
                    dark: '#1a1f36',       // Dark background
                    muted: '#718096',      // Muted text
                },
                // ShadCN colors
                border: 'hsl(var(--border))',
                input: 'hsl(var(--input))',
                ring: 'hsl(var(--ring))',
                background: 'hsl(var(--background))',
                foreground: 'hsl(var(--foreground))',
                primary: {
                    DEFAULT: 'hsl(var(--primary))',
                    foreground: 'hsl(var(--primary-foreground))',
                },
                secondary: {
                    DEFAULT: 'hsl(var(--secondary))',
                    foreground: 'hsl(var(--secondary-foreground))',
                },
                // ... include other color definitions from version 2 as needed
            },
            borderRadius: {
                lg: 'var(--radius)',
                md: 'calc(var(--radius) - 2px)',
                sm: 'calc(var(--radius) - 4px)',
            },
            keyframes: {
                'accordion-down': {
                    from: { height: '0' },
                    to: { height: 'var(--radix-accordion-content-height)' },
                },
                'accordion-up': {
                    from: { height: 'var(--radix-accordion-content-height)' },
                    to: { height: '0' },
                },
                'fade-in': {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                'fade-out': {
                    '0%': { opacity: '1' },
                    '100%': { opacity: '0' },
                },
                'slide-in': {
                    '0%': { transform: 'translateY(10px)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' },
                },
            },
            animation: {
                'accordion-down': 'accordion-down 0.2s ease-out',
                'accordion-up': 'accordion-up 0.2s ease-out',
                'fade-in': 'fade-in 0.3s ease-in',
                'fade-out': 'fade-out 0.3s ease-out',
                'slide-in': 'slide-in 0.4s ease-out',
            },
        },
    },
    plugins: [forms, typography, animate],
};

export default config;