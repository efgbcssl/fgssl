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

                <div className="flex items-center gap-2 sm:gap-4">
                    {/* Theme Toggle */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                                <Icons.sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                                <Icons.moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                                <span className="sr-only">Toggle theme</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setTheme("light")}>
                                <Icons.sun className="mr-2 h-4 w-4" />
                                Light
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setTheme("dark")}>
                                <Icons.moon className="mr-2 h-4 w-4" />
                                Dark
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setTheme("system")}>
                                <Icons.monitor className="mr-2 h-4 w-4" />
                                System
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Notifications - hidden on small screens if needed */}
                    <Button variant="ghost" size="icon" className="hidden sm:inline-flex">
                        <Icons.bell className="h-5 w-5" />
                        <span className="sr-only">Notifications</span>
                    </Button>

                    {/* User Menu */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                                <Avatar className="h-8 w-8">
                                    <AvatarImage src="/avatars/pastor.jpg" alt="User" />
                                    <AvatarFallback>PA</AvatarFallback>
                                </Avatar>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-56" align="end" forceMount>
                            <DropdownMenuItem>
                                <Icons.user className="mr-2 h-4 w-4" />
                                Profile
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                                <Icons.settings className="mr-2 h-4 w-4" />
                                Settings
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive focus:text-destructive">
                                <Icons.logout className="mr-2 h-4 w-4" />
                                Log out
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </header>
    );
}