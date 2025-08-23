// scripts/seedMenuItems.ts
import { connectMongoDB } from '@/lib/mongodb';
import MenuItemModel from '@/models/MenuItem';

const menuItems = [
    // Member menu items
    {
        title: 'Dashboard',
        path: '/dashboard',
        icon: 'LayoutDashboard',
        roles: ['member', 'manager', 'admin'],
        order: 1,
        enabled: true,
        category: 'main'
    },
    {
        title: 'Appointments',
        path: '/dashboard/appointments',
        icon: 'Calendar',
        roles: ['member'],
        order: 2,
        enabled: true,
        category: 'main'
    },
    {
        title: 'Donations',
        path: '/dashboard/donations',
        icon: 'DollarSign',
        roles: ['member'],
        order: 3,
        enabled: true,
        category: 'main'
    },
    {
        title: 'Profile',
        path: '/dashboard/profile',
        icon: 'User',
        roles: ['member', 'manager', 'admin'],
        order: 10,
        enabled: true,
        category: 'settings'
    },

    // Manager menu items
    {
        title: 'Events',
        path: '/dashboard/events',
        icon: 'Calendar',
        roles: ['manager', 'admin'],
        order: 2,
        enabled: true,
        category: 'main'
    },
    {
        title: 'Resources',
        path: '/dashboard/resources',
        icon: 'FileText',
        roles: ['manager', 'admin'],
        order: 3,
        enabled: true,
        category: 'main'
    },

    // Admin menu items (includes everything)
    {
        title: 'Users Management',
        path: '/dashboard/users',
        icon: 'Users',
        roles: ['admin'],
        order: 4,
        enabled: true,
        category: 'main'
    },
    {
        title: 'Analytics & Reports',
        path: '/dashboard/analytics',
        icon: 'BarChart3',
        roles: ['admin', 'manager'],
        order: 5,
        enabled: true,
        category: 'main'
    },
    {
        title: 'Settings',
        path: '/dashboard/settings',
        icon: 'Settings',
        roles: ['admin', 'manager'],
        order: 6,
        enabled: true,
        category: 'settings'
    }
];

async function seedMenuItems() {
    try {
        await connectMongoDB();

        // Clear existing menu items
        await MenuItemModel.deleteMany({});

        // Insert new menu items
        await MenuItemModel.insertMany(menuItems);

        console.log('Menu items seeded successfully');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding menu items:', error);
        process.exit(1);
    }
}

seedMenuItems();