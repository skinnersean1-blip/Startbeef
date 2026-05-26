import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { shoeDb } from "./shoe-prisma";

export const shoeAuthOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  // Separate cookie so shoe and beef sessions don't collide on a shared deployment
  cookies: {
    sessionToken: {
      name: "shoe.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax" as const,
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  pages: {
    signIn: "/auth/signin",
    signOut: "/auth/signout",
    error: "/auth/error",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        identifier: { label: "Email or Handle", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.identifier || !credentials?.password) {
          throw new Error("Invalid credentials");
        }

        const user = await shoeDb.user.findFirst({
          where: {
            OR: [
              { email: credentials.identifier },
              { handle: credentials.identifier },
              { username: credentials.identifier },
            ],
          },
        });

        if (!user || !user.passwordHash) throw new Error("Invalid credentials");

        const valid = await compare(credentials.password, user.passwordHash);
        if (!valid) throw new Error("Invalid credentials");

        return {
          id: user.id,
          email: user.email,
          username: user.username,
          handle: user.handle,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.username = user.username;
        token.handle = user.handle;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.username = token.username as string;
        session.user.handle = token.handle as string;
      }
      return session;
    },
  },
};
