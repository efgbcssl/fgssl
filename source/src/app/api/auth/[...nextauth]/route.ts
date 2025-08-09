/* eslint-disable @typescript-eslint/no-unused-vars */
import NextAuth, { type NextAuthOptions, type User } from "next-auth";
import GoogleProvider, { type GoogleProfile } from "next-auth/providers/google";
import AppleProvider, { type AppleProfile } from "next-auth/providers/apple";
import { xata } from "@/lib/xata";
import type { AdapterUser } from "next-auth/adapters";
import type { JWT } from "next-auth/jwt";
import type { Session } from "next-auth";

// Extend the User type to include your custom fields
declare module "next-auth" {
    interface User {
        id?: string;
        role: string;
    }
    interface Session {
        user: User & {
            id: string;
            role: string;
        };
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        id: string;
        role: string;
    }
}

export const authOptions: NextAuthOptions = {
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID as string,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
        }),
        AppleProvider({
            clientId: process.env.APPLE_CLIENT_ID as string,
            clientSecret: process.env.APPLE_CLIENT_SECRET as string,
        }),
    ],
    pages: {
        signIn: "/auth/login",
        error: "/auth/login",
    },
    callbacks: {
        async signIn({ user, account, profile }) {
            try {
                if (!user.email) {
                    throw new Error("No email provided");
                }

                // Check if user exists in database
                const existingUser = await xata.db.users
                    .filter({ email: user.email })
                    .getFirst();

                if (!existingUser) {
                    // Create new user if doesn't exist
                    await xata.db.users.create({
                        email: user.email,
                        name: user.name || profile?.name || "New User",
                        image: user.image || (profile as GoogleProfile)?.picture || null,
                        role: "member",
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    });
                }

                // Link account if it doesn't exist
                if (account) {
                    const existingAccount = await xata.db.accounts
                        .filter({
                            provider: account.provider,
                            providerAccountId: account.providerAccountId,
                        })
                        .getFirst();

                    if (!existingAccount) {
                        const userRecord = await xata.db.users
                            .filter({ email: user.email })
                            .getFirst();

                        if (userRecord) {
                            await xata.db.accounts.create({
                                userId: userRecord.id,
                                provider: account.provider,
                                providerAccountId: account.providerAccountId,
                                type: account.type,
                                access_token: account.access_token,
                                expires_at: account.expires_at,
                                token_type: account.token_type,
                                scope: account.scope,
                                id_token: account.id_token,
                                createdAt: new Date(),
                                updatedAt: new Date(),
                            });
                        }
                    }
                }

                return true;
            } catch (error) {
                console.error("SignIn Error:", error);
                return false;
            }
        },
        async jwt({ token, user }: { token: JWT; user?: User | AdapterUser }) {
            if (user?.email) {
                const dbUser = await xata.db.users
                    .filter({ email: user.email })
                    .getFirst();

                if (dbUser) {
                    token.id = dbUser.id;
                    token.role = dbUser.role;
                }
            }
            return token;
        },
        async session({ session, token }: { session: Session; token: JWT }) {
            if (session.user && token.id && token.role) {
                session.user.id = token.id;
                session.user.role = token.role;
            }
            return session;
        },
    },
    session: {
        strategy: "jwt",
        maxAge: 24 * 60 * 60, // 24 hours
    },
    secret: process.env.NEXTAUTH_SECRET,
    debug: process.env.NODE_ENV === "development",
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };