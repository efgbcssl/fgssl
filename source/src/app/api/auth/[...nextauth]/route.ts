/* eslint-disable @typescript-eslint/no-unused-vars */


import NextAuth from "next-auth";
import GoogleProvider, { type GoogleProfile } from "next-auth/providers/google";
import AppleProvider, { type AppleProfile } from "next-auth/providers/apple";
import { xata } from "@/lib/xata";
import type { NextAuthConfig } from "next-auth";
import { randomUUID } from "crypto";


// Define the auth configuration
const authConfig: NextAuthConfig = {
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID as string,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
            profile(profile: GoogleProfile) {
                return {
                    id: profile.sub,
                    name: profile.name,
                    email: profile.email,
                    image: profile.picture,
                };
            },
        }),
        AppleProvider({
            clientId: process.env.APPLE_CLIENT_ID as string,
            clientSecret: process.env.APPLE_CLIENT_SECRET as string,
            profile(profile: AppleProfile) {
                return {
                    id: profile.sub,
                    name: profile.name,
                    email: profile.email,
                    image: null, // Apple doesn't provide profile picture
                };
            },
        }),
    ],
    pages: {
        signIn: "/login",
        error: "/login",
    },
    callbacks: {
        async signIn({ user, account, profile }) {
            console.log("SignIn Callback:", { user, account, profile });

            // Block sign in if no email
            if (!user.email) {
                console.error("No email provided");
                return false;
            }

            try {
                // Upsert user in database
                const userId = randomUUID();
                const userData = {
                    email: user.email,
                    name: user.name || profile?.name || "New User",
                    image: user.image || (profile as GoogleProfile)?.picture || null,
                    role: "member",
                    phone: null,
                    emailVerified: new Date(),
                    updatedAt: new Date(),
                };

                const existingUser = await xata.db.users
                    .filter({ email: user.email })
                    .getFirst();

                const dbUser = existingUser
                    ? await xata.db.users.update(existingUser.xata_id, userData)
                    : await xata.db.users.create({
                        ...userData,
                        id: userId,
                        createdAt: new Date(),
                    });

                if (!dbUser) {
                    console.error("Failed to create/update user");
                    return false;
                }

                // Handle account linking if OAuth provider
                if (account) {
                    const accountData = {
                        userId: dbUser.xata_id,
                        provider: account.provider,
                        providerAccountId: account.providerAccountId,
                        type: account.type,
                        access_token: account.access_token || null,
                        expires_at: account.expires_at || null,
                        expires_att: account.expires_at ? new Date(account.expires_at * 1000).toISOString() : null,
                        token_type: account.token_type || null,
                        scope: account.scope || null,
                        id_token: account.id_token || null,
                        updatedAt: new Date(),
                    };

                    const existingAccount = await xata.db.accounts
                        .filter({
                            provider: account.provider,
                            providerAccountId: account.providerAccountId,
                        })
                        .getFirst();

                    if (!existingAccount) {
                        await xata.db.accounts.create({
                            ...accountData,
                            createdAt: new Date(),
                        });
                    } else {
                        await xata.db.accounts.update(existingAccount.xata_id, accountData);
                    }
                }

                return true;
            } catch (error) {
                console.error("SignIn Error:", error);
                return false;
            }
        },
        async jwt({ token, user, account, profile }) {
            // Initial sign in
            if (account && user?.email) {
                const dbUser = await xata.db.users
                    .filter({ email: user.email })
                    .getFirst();

                if (dbUser) {
                    token.id = dbUser.xata_id;
                    token.role = dbUser.role;
                    token.email = dbUser.email;
                    token.name = dbUser.name;
                    token.picture = dbUser.image;
                }
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.id as string;
                session.user.role = token.role as string;
                session.user.name = token.name as string;
                session.user.email = token.email as string;
                session.user.image = token.picture as string | null;
            }
            return session;
        },
        async redirect({ url, baseUrl }) {
            // Allows relative callback URLs
            if (url.startsWith("/")) return `${baseUrl}${url}`;
            // Allows callback URLs on the same origin
            else if (new URL(url).origin === baseUrl) return url;
            return baseUrl;
        },
    },
    session: {
        strategy: "jwt",
        maxAge: 30 * 24 * 60 * 60, // 30 days
        updateAge: 24 * 60 * 60, // 24 hours
    },
    cookies: {
        sessionToken: {
            name: `__Secure-next-auth.session-token`,
            options: {
                httpOnly: true,
                sameSite: "lax",
                path: "/",
                secure: process.env.NODE_ENV === "production",
                domain: process.env.NODE_ENV === "production"
                    ? `.${process.env.NEXT_PUBLIC_DOMAIN}`
                    : undefined,
            },
        },
        callbackUrl: {
            name: `__Secure-next-auth.callback-url`,
            options: {
                sameSite: "lax",
                path: "/",
                secure: process.env.NODE_ENV === "production",
                domain: process.env.NODE_ENV === "production"
                    ? `.${process.env.NEXT_PUBLIC_DOMAIN}`
                    : undefined,
            },
        },
        csrfToken: {
            name: `__Host-next-auth.csrf-token`,
            options: {
                httpOnly: true,
                sameSite: "lax",
                path: "/",
                secure: process.env.NODE_ENV === "production",
            },
        },
    },
    secret: process.env.NEXTAUTH_SECRET,
    debug: process.env.NODE_ENV === "development",
    trustHost: true,
};

// Export the handlers directly
export const { GET, POST } = NextAuth(authConfig).handlers;

// Optional: Specify Edge runtime for better performance (if your providers support it)
export const runtime = "nodejs";