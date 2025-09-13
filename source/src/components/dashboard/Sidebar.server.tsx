/* eslint-disable @typescript-eslint/no-unused-vars */
// components/dashboard/Sidebar.server.tsx
import { auth } from '@/auth';
import { SidebarClient } from './Sidebar.client';
import { Icons } from './Icons';

// Map icon names to actual icon components
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
    dashboard: Icons.dashboard,
    calendar: Icons.calendar,
    message: Icons.message,
    bell: Icons.bell,
    donate: Icons.donate,
    users: Icons.users,
    settings: Icons.settings,
    fileText: Icons.fileText,
    barChart: Icons.barChart,
    user: Icons.user,
    helpCircle: Icons.helpCircle,
    // Add more icons as needed
};

// Helper for initials
function getInitials(name?: string | null) {
    if (!name) return 'U';
    const parts = name.split(' ');
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export async function SidebarServer() {
    const session = await auth();

    if (!session || !session.user) {
        return null;
    }

    const userRole = session.user.role || 'member';

    // Use fallback menu items for now to avoid client-side rendering issues
    const fallbackItems = [
        { _id: '1', name: 'Dashboard', href: '/dashboard', icon: Icons.dashboard },
    ];

    if (userRole === 'member') {
        fallbackItems.push(
            { _id: '2', name: 'My Profile', href: '/dashboard/profile', icon: Icons.user },
            { _id: '3', name: 'Appointments', href: '/dashboard/appointments', icon: Icons.calendar },
            { _id: '4', name: 'Donations', href: '/dashboard/donations', icon: Icons.donate },
            { _id: '5', name: 'Messages', href: '/dashboard/messages', icon: Icons.message }
        );
    } else if (userRole === 'manager') {
        fallbackItems.push(
            { _id: '2', name: 'My Profile', href: '/dashboard/profile', icon: Icons.user },
            { _id: '3', name: 'Appointments', href: '/dashboard/appointments', icon: Icons.calendar },
            { _id: '4', name: 'Donations', href: '/dashboard/donations', icon: Icons.donate },
            { _id: '5', name: 'Messages', href: '/dashboard/messages', icon: Icons.message },
            { _id: '6', name: 'Events Management', href: '/dashboard/events', icon: Icons.calendar },
            { _id: '7', name: 'Resources Management', href: '/dashboard/resources', icon: Icons.fileText },
            { _id: '8', name: 'FAQ Management', href: '/dashboard/faq', icon: Icons.helpCircle }
        );
    } else if (userRole === 'admin') {
        fallbackItems.push(
            { _id: '2', name: 'My Profile', href: '/dashboard/profile', icon: Icons.user },
            { _id: '3', name: 'Appointments', href: '/dashboard/appointments', icon: Icons.calendar },
            { _id: '4', name: 'Donations', href: '/dashboard/donations', icon: Icons.donate },
            { _id: '5', name: 'Messages', href: '/dashboard/messages', icon: Icons.message },
            { _id: '6', name: 'Events Management', href: '/dashboard/events', icon: Icons.calendar },
            { _id: '7', name: 'Resources Management', href: '/dashboard/resources', icon: Icons.fileText },
            { _id: '8', name: 'FAQ Management', href: '/dashboard/faq', icon: Icons.helpCircle },
            { _id: '9', name: 'User Management', href: '/dashboard/permissions', icon: Icons.users },
            { _id: '10', name: 'Blog Management', href: '/dashboard/blog', icon: Icons.fileText },
            { _id: '11', name: 'Analytics', href: '/dashboard/analytics', icon: Icons.barChart },
            { _id: '12', name: 'Settings', href: '/dashboard/settings', icon: Icons.settings }
        );
    }

    return (
        <SidebarClient
            navItems={fallbackItems}
            user={{
                name: session.user.name || '',
                email: session.user.email || '',
                role: userRole,
                image: session.user.image || null
            }}
        />
    );
}