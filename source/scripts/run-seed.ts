/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { seedMenuItems } from '../src/scripts/seedMenuItems';

async function main() {
    console.log('Starting menu items seeding...');
    const success = await seedMenuItems();
    
    if (success) {
        console.log('✅ Menu items seeded successfully!');
        process.exit(0);
    } else {
        console.error('❌ Menu items seeding failed!');
        process.exit(1);
    }
}

main().catch((error) => {
    console.error('Error running seed script:', error);
    process.exit(1);
});
