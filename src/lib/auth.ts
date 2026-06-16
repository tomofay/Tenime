import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const { email, password } = credentials as {
          email: string;
          password: string;
        };

        if (!email || !password) return null;

        const user = await db.user.findUnique({
          where: { email },
        });

        if (!user) return null;

        const isValid = await bcrypt.compare(password, user.passwordHash);
        if (!isValid) return null;

        return {
          id: user.id,
          name: user.username,
          email: user.email,
          image: user.avatarUrl ? `avatar` : null,
        };
      },
    }),
  ],
  pages: {
    signIn: "/auth/login",
  },
  callbacks: {
    jwt: async ({ token, user, trigger, session }) => {
      if (user) {
        token.id = user.id;
        token.username = user.name;
        token.hasAvatar = !!user.image;
      }
      if (trigger === "update" && session) {
        const s = session as Record<string, unknown>;
        if (s.hasAvatar !== undefined) {
          token.hasAvatar = s.hasAvatar as boolean;
        }
      }
      delete token.picture;
      return token;
    },
    session: async ({ session, token }) => {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.name = token.username as string;
        session.user.image = token.hasAvatar && token.id
          ? `/api/user/avatar/${token.id}`
          : null;
      }
      return session;
    },
  },
  session: {
    strategy: "jwt",
  },
});
