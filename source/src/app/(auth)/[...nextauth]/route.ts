import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import AppleProvider from "next-auth/providers/apple";
import { xata } from '@/lib/xata';


const handler = NextAuth({
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        }),
        AppleProvider({
            clientId: process.env.APPLE_CLIENT_ID!,
            clientSecret: process.env.APPLE_CLIENT_SECRET!,
        }),
    ],
    pages: {
        signIn: '/auth/login', 
    },
    callbacks: {
        async jwt({ token, account, profile }) {
            if (account && profile) {
                token.id = profile.id;
                token.email = profile.email;
                token.name = profile.name || '';
                token.phone = profile.phone || null;

                const user = await xata.db.users.filter({ email: profile.email }).getFirst();
                token.role = user?.role || 'user'; // Default to 'user'
            }
            return token;
        },
        async session({ session, token }) {
            session.user.id = token.id;
            session.user.email = token.email;
            session.user.name = token.name;
            session.user.phone = token.phone;
            session.user.role = token.role;
            return session;
        },
    },
    session: {
        strategy: 'jwt',
        maxAge: 24 * 60 * 60, // 24 hours
    },
    secret: process.env.NEXTAUTH_SECRET,
    debug: process.env.NODE_ENV === 'development',
});

export { handler as GET, handler as POST };
