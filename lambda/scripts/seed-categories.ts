import * as dotenv from 'dotenv';
import * as path from 'path';

// MUST be before any other imports that depend on env vars
dotenv.config({ path: path.join(__dirname, '../.env') });

import { CategoryRepository } from '../core/shared/repositories/category.repository';
import { v4 as uuidv4 } from 'uuid';

const categoryRepo = new CategoryRepository();

const DATA = [
    {
        name: 'Renovation & Construction',
        icon: 'hammer-outline',
        order: 1,
        skills: [
            'Plumbing',
            'Electrical Work',
            'Painting',
            'Tiling',
            'Carpentry',
            'Masonry',
            'Drywall Installation',
            'Flooring',
            'Roofing'
        ]
    },
    {
        name: 'Cleaning & Housework',
        icon: 'sparkles-outline',
        order: 2,
        skills: [
            'General Cleaning',
            'Deep Cleaning',
            'Window Washing',
            'Carpet Cleaning',
            'Laundry & Ironing',
            'Dishwashing',
            'Pool Cleaning'
        ]
    },
    {
        name: 'IT & Digital Services',
        icon: 'laptop-outline',
        order: 3,
        skills: [
            'Web Development',
            'Mobile App Development',
            'Graphic Design',
            'UI/UX Design',
            'PC Repair',
            'Software Installation',
            'Cybersecurity',
            'Digital Marketing'
        ]
    },
    {
        name: 'Beauty & Personal Care',
        icon: 'cut-outline',
        order: 4,
        skills: [
            'Hairdressing',
            'Manicure & Pedicure',
            'Makeup Artist',
            'Massage Therapy',
            'Cosmetology',
            'Personal Training',
            'Yoga Instruction'
        ]
    },
    {
        name: 'Logistics & Delivery',
        icon: 'bicycle-outline',
        order: 5,
        skills: [
            'Courier Delivery',
            'Moving Services',
            'Furniture Assembly',
            'Grocery Shopping',
            'Heavy Lifting',
            'Driving'
        ]
    },
    {
        name: 'Tutoring & Education',
        icon: 'book-outline',
        order: 6,
        skills: [
            'English Language',
            'Mathematics',
            'Physics',
            'Music Lessons',
            'Drawing Classes',
            'Programming Basics',
            'Test Preparation'
        ]
    },
    {
        name: 'Events & Decoration',
        icon: 'calendar-outline',
        order: 7,
        skills: [
            'Photography',
            'Videography',
            'DJ Services',
            'Event Catering',
            'Flower Decoration',
            'Balloon Art',
            'Host/MC'
        ]
    },
    {
        name: 'Auto Services',
        icon: 'car-outline',
        order: 8,
        skills: [
            'Car Diagnostics',
            'Oil Change',
            'Tire Service',
            'Car Wash',
            'Engine Repair',
            'Body Work',
            'Auto Electrician'
        ]
    }
];

async function seed() {
    console.log('--- Starting Database Seeding ---');

    try {
        for (const catData of DATA) {
            console.log(`Creating category: ${catData.name}...`);
            const category = await categoryRepo.createCategory({
                name: catData.name,
                icon: catData.icon,
                order: catData.order,
                isActive: true
            });

            console.log(`  Adding skills for ${catData.name}:`);
            for (const skillName of catData.skills) {
                await categoryRepo.createSkill({
                    name: skillName,
                    categoryId: category.id,
                    isActive: true
                });
                console.log(`    - ${skillName}`);
            }
        }

        console.log('--- Seeding Completed Successfully! ---');
    } catch (error) {
        console.error('Seeding failed:', error);
        process.exit(1);
    }
}

seed();
