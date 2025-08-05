/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import { Icons } from '@/components/dashboard/Icons';
import { Button } from '@/components/ui/button';
import { useTheme } from 'next-themes';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface NavbarProps {
    className?: string;
    onMenuToggle?: () => void; // For mobile sidebar toggle
}

export function Navbar({ className, onMenuToggle }: NavbarProps) {
    const { setTheme } = useTheme();

    return (
        <header className={cn(
            "sticky top-0 z-40 flex items-center h-16 px-4 sm:px-6 border-b border-border bg-card backdrop-blur supports-[backdrop-filter]:bg-card/80",
            className
        )}>
            <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-4">
                    {/* Mobile menu button - only shows on small screens */}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="md:hidden"
                        onClick={onMenuToggle}
                    >
                        <Icons.menu className="h-5 w-5" />
                        <span className="sr-only">Toggle menu</span>
                    </Button>

                    {/* Logo/Brand - hidden on mobile if you want */}
                    <div className="hidden md:flex items-center">
                        <h1 className="text-lg font-heading font-semibold">Dashboard</h1>
                    </div>
                </div>

            </div>
        </header>
    );
}