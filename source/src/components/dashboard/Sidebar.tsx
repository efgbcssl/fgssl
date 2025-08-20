'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icons } from './Icons';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { LogOut } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getCurrentUser } from '@/lib/getCurrentUser'; // a server function you create

const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: Icons.dashboard },
    { name: 'Events', href: '/dashboard/events', icon: Icons.calendar },
    { name: 'Appointments', href: '/dashboard/appointments', icon: Icons.calendar },
    { name: 'FAQ', href: '/dashboard/faq', icon: Icons.message },
    { name: 'Blog', href: '/dashboard/blog', icon: Icons.bell },
    { name: 'Resources', href: '/dashboard/resources', icon: Icons.calendar },
    { name: 'Donations', href: '/dashboard/donations', icon: Icons.donate },
    { name: 'Messages', href: '/dashboard/messages', icon: Icons.message },
];

// helper for initials
function getInitials(name?: string | null) {
    if (!name) return 'U';
    const parts = name.split(' ');
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

interface SidebarProps {
    className?: string;
}

export function Sidebar({ className }: SidebarProps) {
    const pathname = usePathname();
    const [user, setUser] = useState({ name: '', email: '', role: 'member' });

    useEffect(() => {
        async function fetchUser() {
            const data = await getCurrentUser();
            if (data) setUser(data);
        }
        fetchUser();
    }, []);

    return (
        <div className={cn('flex flex-col h-full', className)}>
            {/* Nav items */}
            <div className="flex-1 overflow-y-auto">
                <nav className="px-2 py-4 space-y-1">
                    {navItems.map((item) => (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={cn(
                                'group flex items-center px-3 py-3 text-sm font-medium rounded-md',
                                pathname === item.href
                                    ? 'bg-accent text-accent-foreground'
                                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                            )}
                        >
                            <item.icon className="flex-shrink-0 h-5 w-5 mr-3" />
                            {item.name}
                        </Link>
                    ))}
                </nav>
            </div>

            {/* User info */}
            <div className="p-4 border-t border-border flex items-center">
                <Avatar>
                    <AvatarFallback className="bg-muted text-sm font-semibold">
                        {getInitials(user.name)}
                    </AvatarFallback>
                </Avatar>
                <div className="ml-3">
                    <p className="text-sm font-medium">{user.name}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                    <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
                </div>
            </div>

            {/* Sign out */}
            <div className="p-4 border-t border-border mt-auto">
                <Link
                    href="/api/auth/signout?callbackUrl=/login"
                    className="flex items-center text-sm font-medium text-destructive hover:text-destructive/80"
                >
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                </Link>
            </div>
        </div>
    );
}
