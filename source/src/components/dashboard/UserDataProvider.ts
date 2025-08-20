// src/components/dashboard/UserDataProvider.ts
import { auth } from '@/auth';

export async function getUserData() {
    const session = await auth();

    if (!session?.user) {
        return { name: '', email: '', role: 'member', image: null };
    }

    return {
        name: session.user.name ?? '',
        email: session.user.email ?? '',
        role: session.user.role ?? 'member',
        image: session.user.image ?? null,
    };
}
