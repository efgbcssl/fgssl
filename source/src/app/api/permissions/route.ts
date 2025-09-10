/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { connectMongoDB } from '@/lib/mongodb';
import { UserModel } from '@/models/User';

// GET - Fetch all users with their roles (Admin only)
export async function GET() {
    try {
        const session = await auth();
        
        if (!session?.user || session.user.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        await connectMongoDB();
        
        const users = await UserModel.find({}, {
            id: 1,
            name: 1,
            email: 1,
            role: 1,
            image: 1,
            createdAt: 1
        }).sort({ createdAt: -1 });

        return NextResponse.json({ users });
    } catch (error) {
        console.error('Error fetching users:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// PUT - Update user role (Admin only)
export async function PUT(request: NextRequest) {
    try {
        const session = await auth();
        
        if (!session?.user || session.user.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const { userId, role } = await request.json();

        if (!userId || !role) {
            return NextResponse.json({ error: 'User ID and role are required' }, { status: 400 });
        }

        if (!['admin', 'manager', 'member'].includes(role)) {
            return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
        }

        await connectMongoDB();
        
        const user = await UserModel.findOneAndUpdate(
            { id: userId },
            { role },
            { new: true }
        );

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        return NextResponse.json({ 
            message: 'User role updated successfully',
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Error updating user role:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// DELETE - Delete user (Admin only)
export async function DELETE(request: NextRequest) {
    try {
        const session = await auth();
        
        if (!session?.user || session.user.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
        }

        // Prevent admin from deleting themselves
        if (userId === session.user.id) {
            return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 });
        }

        await connectMongoDB();
        
        const user = await UserModel.findOneAndDelete({ id: userId });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        return NextResponse.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Error deleting user:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
