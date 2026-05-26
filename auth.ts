import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  callbacks: {
    async signIn({ user, account }) {
      console.log("signIn callback:", { user, account });
      return true;
    },
    async session({ session, token }) {
      console.log("session callback:", { session, token });
      return session;
    },
    async redirect({ url, baseUrl }) {
      // If being sent to onboarding explicitly, allow it
      if (url.includes("/onboarding")) return url;

      // Extract email from the URL if possible, otherwise just go to dashboard
      // Check if user has completed onboarding by looking at their industries
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

      // Default: if URL is on same site go there, else go to dashboard
      if (url.startsWith(baseUrl)) return url;
      return `${baseUrl}/dashboard`;
    },
  },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
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