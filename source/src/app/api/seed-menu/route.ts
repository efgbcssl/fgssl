/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { connectMongoDB } from '@/lib/mongodb';
import { MenuItemModel } from '@/models/MenuItem';

const menuItems = [
    // Member menu items
    {
        title: 'Dashboard',
        path: '/dashboard',
        icon: 'dashboard',
        roles: ['admin', 'manager', 'member'],
        order: 1,
        enabled: true,
        category: 'main'
    },
    {
        title: 'My Profile',
        path: '/dashboard/profile',
        icon: 'user',
        roles: ['admin', 'manager', 'member'],
        order: 2,
        enabled: true,
        category: 'main'
    },
    {
        title: 'My Appointments',
        path: '/dashboard/appointments',
        icon: 'calendar',
        roles: ['admin', 'manager', 'member'],
        order: 3,
        enabled: true,
        category: 'main'
    },
    {
        title: 'My Donations',
        path: '/dashboard/donations',
        icon: 'donate',
        roles: ['admin', 'manager', 'member'],
        order: 4,
        enabled: true,
        category: 'main'
    },
    {
        title: 'Messages',
        path: '/dashboard/messages',
        icon: 'message',
        roles: ['admin', 'manager', 'member'],
        order: 5,
        enabled: true,
        category: 'main'
    },

    // Manager menu items
    {
        title: 'Events Management',
        path: '/dashboard/events',
        icon: 'calendar',
        roles: ['admin', 'manager'],
        order: 10,
        enabled: true,
        category: 'main'
    },
    {
        title: 'Resources Management',
        path: '/dashboard/resources',
        icon: 'fileText',
        roles: ['admin', 'manager'],
        order: 11,
        enabled: true,
        category: 'main'
    },
    {
        title: 'FAQ Management',
        path: '/dashboard/faq',
        icon: 'helpCircle',
        roles: ['admin', 'manager'],
        order: 12,
        enabled: true,
        category: 'main'
    },

    // Admin menu items
    {
        title: 'User Management',
        path: '/dashboard/permissions',
        icon: 'users',
        roles: ['admin'],
        order: 20,
        enabled: true,
        category: 'main'
    },
    {
        title: 'Blog Management',
        path: '/dashboard/blog',
        icon: 'fileText',
        roles: ['admin'],
        order: 21,
        enabled: true,
        category: 'main'
    },
    {
        title: 'Analytics',
        path: '/dashboard/analytics',
        icon: 'barChart',
        roles: ['admin'],
        order: 22,
        enabled: true,
        category: 'main'
    },
    {
        title: 'Settings',
        path: '/dashboard/settings',
        icon: 'settings',
        roles: ['admin'],
        order: 23,
        enabled: true,
        category: 'settings'
    }
];

export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        
        if (!session?.user || session.user.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        await connectMongoDB();
        
        // Clear existing menu items
        await MenuItemModel.deleteMany({});
        
        // Insert new menu items
        await MenuItemModel.insertMany(menuItems);
        
        return NextResponse.json({ 
            message: 'Menu items seeded successfully',
            count: menuItems.length
        });
    } catch (error) {
        console.error('Error seeding menu items:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
