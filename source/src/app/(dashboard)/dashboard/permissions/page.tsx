/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Search, Shield, Users, Trash2, Edit, Save, X } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface User {
    id: string;
    name: string;
    email: string;
    role: string;
    image?: string;
    createdAt: string;
}

export default function PermissionsPage() {
    const { data: session, status } = useSession();
    const [users, setUsers] = useState<User[]>([]);
    const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [editingUser, setEditingUser] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState<string | null>(null);

    // Check if user is admin
    if (status === 'loading') {
        return <div>Loading...</div>;
    }

    if (!session || session.user.role !== 'admin') {
        redirect('/unauthorized');
    }

    useEffect(() => {
        fetchUsers();
    }, []);

    useEffect(() => {
        const filtered = users.filter(user =>
            user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredUsers(filtered);
    }, [users, searchTerm]);

    const fetchUsers = async () => {
        try {
            const response = await fetch('/api/permissions');
            if (response.ok) {
                const data = await response.json();
                setUsers(data.users);
            } else {
                toast({
                    title: 'Error',
                    description: 'Failed to fetch users',
                    variant: 'destructive',
                });
            }
        } catch (error) {
            console.error('Error fetching users:', error);
            toast({
                title: 'Error',
                description: 'Failed to fetch users',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    const updateUserRole = async (userId: string, newRole: string) => {
        setUpdating(userId);
        try {
            const response = await fetch('/api/permissions', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ userId, role: newRole }),
            });

            if (response.ok) {
                setUsers(users.map(user => 
                    user.id === userId ? { ...user, role: newRole } : user
                ));
                setEditingUser(null);
                toast({
                    title: 'Success',
                    description: 'User role updated successfully',
                });
            } else {
                const error = await response.json();
                toast({
                    title: 'Error',
                    description: error.error || 'Failed to update user role',
                    variant: 'destructive',
                });
            }
        } catch (error) {
            console.error('Error updating user role:', error);
            toast({
                title: 'Error',
                description: 'Failed to update user role',
                variant: 'destructive',
            });
        } finally {
            setUpdating(null);
        }
    };

    const deleteUser = async (userId: string) => {
        try {
            const response = await fetch(`/api/permissions?userId=${userId}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                setUsers(users.filter(user => user.id !== userId));
                toast({
                    title: 'Success',
                    description: 'User deleted successfully',
                });
            } else {
                const error = await response.json();
                toast({
                    title: 'Error',
                    description: error.error || 'Failed to delete user',
                    variant: 'destructive',
                });
            }
        } catch (error) {
            console.error('Error deleting user:', error);
            toast({
                title: 'Error',
                description: 'Failed to delete user',
                variant: 'destructive',
            });
        }
    };

    const getRoleColor = (role: string) => {
        switch (role) {
            case 'admin': return 'bg-red-100 text-red-800';
            case 'manager': return 'bg-blue-100 text-blue-800';
            case 'member': return 'bg-green-100 text-green-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getRoleIcon = (role: string) => {
        switch (role) {
            case 'admin': return <Shield className="h-4 w-4" />;
            case 'manager': return <Users className="h-4 w-4" />;
            case 'member': return <Users className="h-4 w-4" />;
            default: return <Users className="h-4 w-4" />;
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-church-primary mx-auto"></div>
                    <p className="mt-2 text-gray-600">Loading users...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">User Permissions</h1>
                    <p className="text-gray-600">Manage user roles and permissions</p>
                </div>
                <Badge className="bg-red-100 text-red-800">
                    <Shield className="h-4 w-4 mr-1" />
                    Admin Only
                </Badge>
            </div>

            {/* Search */}
            <Card>
                <CardContent className="p-6">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <Input
                            placeholder="Search users by name or email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Users List */}
            <div className="grid gap-4">
                {filteredUsers.map((user) => (
                    <Card key={user.id}>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-4">
                                    <Avatar>
                                        {user.image ? (
                                            <AvatarImage src={user.image} alt={user.name} />
                                        ) : null}
                                        <AvatarFallback>
                                            {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <h3 className="font-semibold text-gray-900">{user.name}</h3>
                                        <p className="text-sm text-gray-600">{user.email}</p>
                                        <p className="text-xs text-gray-500">
                                            Joined: {new Date(user.createdAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center space-x-4">
                                    {editingUser === user.id ? (
                                        <div className="flex items-center space-x-2">
                                            <Select
                                                defaultValue={user.role}
                                                onValueChange={(value) => updateUserRole(user.id, value)}
                                            >
                                                <SelectTrigger className="w-32">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="member">Member</SelectItem>
                                                    <SelectItem value="manager">Manager</SelectItem>
                                                    <SelectItem value="admin">Admin</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => setEditingUser(null)}
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ) : (
                                        <>
                                            <Badge className={getRoleColor(user.role)}>
                                                {getRoleIcon(user.role)}
                                                <span className="ml-1 capitalize">{user.role}</span>
                                            </Badge>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => setEditingUser(user.id)}
                                                disabled={updating === user.id}
                                            >
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            {user.id !== session.user.id && (
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700">
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>Delete User</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                Are you sure you want to delete {user.name}? This action cannot be undone.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                            <AlertDialogAction
                                                                onClick={() => deleteUser(user.id)}
                                                                className="bg-red-600 hover:bg-red-700"
                                                            >
                                                                Delete
                                                            </AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {filteredUsers.length === 0 && (
                <Card>
                    <CardContent className="p-12 text-center">
                        <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">No users found</h3>
                        <p className="text-gray-600">
                            {searchTerm ? 'Try adjusting your search terms' : 'No users have been registered yet'}
                        </p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
