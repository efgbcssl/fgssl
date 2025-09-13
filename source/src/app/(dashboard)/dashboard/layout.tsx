// app/dashboard/layout.tsx
import type { Metadata } from 'next';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { SessionProvider } from 'next-auth/react';
import { SessionRefresh } from '@/components/providers/session-refresh';
import { SessionDebug } from '@/components/debug/session-debug';
import { SidebarServer } from '@/components/dashboard/Sidebar.server';

export const metadata: Metadata = {
    title: 'Church Dashboard',
    description: 'Administrative dashboard for church management',
};

export default async function DashboardLayoutWrapper({
    children
}: {
    children: React.ReactNode
}) {
    // Render SidebarServer on the server side
    const sidebarContent = await SidebarServer();

    return (
        <SessionProvider>
            <SessionRefresh />
            <SessionDebug />
            <DashboardLayout sidebarContent={sidebarContent}>
                {children}
            </DashboardLayout>
        </SessionProvider>
    );
}