/**
 * @file auth.ts
 * @description NextAuth.js configuration. Supports Google OAuth and email/password
 * credentials. Uses JWT sessions, Prisma adapter, and custom redirect logic to
 * send new users to onboarding and returning users to the dashboard.
 */

import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  cookies: {
    pkceCodeVerifier: {
      name: "next-auth.pkce.code_verifier",
      options: {
        httpOnly: true,
        sameSite: "none",
        path: "/",
        secure: true,
      },
    },
    state: {
      name: "next-auth.state",
      options: {
        httpOnly: true,
        sameSite: "none",
        path: "/",
        secure: true,
      },
    },
  },
  callbacks: {
    /**
     * Called after a successful sign-in. Always allows the sign-in to proceed.
     * @param {{ user: object, account: object }} params - The signed-in user and OAuth account
     * @returns {Promise<boolean>} Always true
     */
    async signIn({ user, account }) {
      console.log("signIn callback:", { user, account });
      return true;
    },
    /**
     * Enriches the session object before it is returned to the client.
     * @param {{ session: object, token: object }} params - Current session and JWT token
     * @returns {Promise<object>} The (optionally enriched) session
     */
    async session({ session, token }) {
      console.log("session callback:", { session, token });
      return session;
    },
    /**
     * Determines where to redirect after sign-in. New users (no industries set)
     * are sent to /onboarding; all others go to /dashboard.
     * @param {{ url: string, baseUrl: string }} params - The requested URL and app base URL
     * @returns {Promise<string>} The resolved redirect URL
     */
    async redirect({ url, baseUrl }) {
      if (url.includes("/onboarding")) return url;

      try {
        const urlObj = new URL(url);
        const email = urlObj.searchParams.get("email");

        if (email) {
          const user = await prisma.user.findUnique({
            where: { email },
            select: { industries: true },
          });
          if (!user || !user.industries || user.industries.length === 0) {
            return `${baseUrl}/onboarding`;
          }
        }
      } catch {}

      if (url.startsWith(baseUrl)) return url;
      return `${baseUrl}/dashboard`;
    },
  },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      checks: ["none"],
    }),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      /**
       * Validates email/password credentials against the database.
       * @param {object} credentials - The submitted { email, password }
       * @returns {Promise<object | null>} The user record on success, null on failure
       */
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });

        if (!user || !user.password) return null;

        const passwordMatch = await bcrypt.compare(
          credentials.password as string,
          user.password
        );

        return passwordMatch ? user : null;
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
});