'use client';

import { Button } from '@/components/ui/button';
import { Settings } from 'lucide-react';

export function SeedMenuButton() {
    const handleSeedMenu = async () => {
        try {
            const response = await fetch('/api/seed-menu', { method: 'POST' });
            if (response.ok) {
                alert('Menu items seeded successfully!');
            } else {
                alert('Failed to seed menu items');
            }
        } catch (error) {
            alert('Error seeding menu items');
        }
    };

    return (
        <Button 
            variant="outline" 
            className="h-16" 
            onClick={handleSeedMenu}
        >
            <Settings className="h-5 w-5 mr-2" /> Seed Menu Items
        </Button>
    );
}
