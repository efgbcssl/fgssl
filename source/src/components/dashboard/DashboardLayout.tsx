// components/dashboard/DashboardLayout.tsx
'use client';

import { useState } from 'react';
import { Navbar } from './NavBar';

interface DashboardLayoutProps {
    children: React.ReactNode;
    sidebarContent: React.ReactNode;
}

export function DashboardLayout({ children, sidebarContent }: DashboardLayoutProps) {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="flex h-screen overflow-hidden bg-background">
            {/* Desktop Sidebar */}
            <div className="hidden md:block">
                {sidebarContent}
            </div>

            {/* Mobile Sidebar */}
            <div className={`fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 md:hidden ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                {sidebarContent}
            </div>

            {/* Overlay when mobile sidebar open */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            <div className="flex flex-col flex-1 overflow-hidden">
                <Navbar onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
                <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-muted/20">
                    {children}
                </main>
            </div>
        </div>
    );
}