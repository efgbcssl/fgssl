'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icons } from '@/components/dashboard/Icons';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils'; // Use your existing cn utility

interface SidebarProps {
    className?: string;
}

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

export function Sidebar({ className }: SidebarProps) {
    const pathname = usePathname();

    return (
        <div className={cn(
            "hidden md:flex md:flex-shrink-0",
            className
        )}>
            <div className="flex flex-col w-64 border-r border-border bg-card">
                <div className="flex items-center h-16 px-4 border-b border-border">
                    <span className="h-8 w-8 text-church-primary">
                        <Icons.logo />
                    </span>
                    <span className="ml-2 text-xl font-heading font-bold text-church-primary">
                        ChurchAdmin
                    </span>
                </div>
                <div className="flex flex-col flex-1 overflow-y-auto">
                    <nav className="flex-1 px-2 py-4 space-y-1">
                        {navItems.map((item) => (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={cn(
                                    "group flex items-center px-3 py-3 text-sm font-medium rounded-md",
                                    pathname === item.href
                                        ? "bg-accent text-accent-foreground"
                                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                                )}
                            >
                                <item.icon className="flex-shrink-0 h-5 w-5 mr-3" />
                                {item.name}
                            </Link>
                        ))}
                    </nav>
                </div>
                <div className="p-4 border-t border-border">
                    <div className="flex items-center">
                        <Avatar>
                            <AvatarImage src="/avatars/pastor.jpg" />
                            <AvatarFallback>PA</AvatarFallback>
                        </Avatar>
                        <div className="ml-3">
                            <p className="text-sm font-medium">Pastor Andrew</p>
                            <p className="text-xs text-muted-foreground">Administrator</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}