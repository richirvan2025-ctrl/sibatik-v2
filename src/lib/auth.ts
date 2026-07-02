import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  trustHost: true,
  adapter: PrismaAdapter(prisma) as any,
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 24, // 1 hari
  },
  cookies: {
    sessionToken: {
      name: `authjs.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: true,
        maxAge: 60 * 60 * 24, // 1 hari
      },
    },
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });

        if (!user || !user.password) {
          return null;
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password as string,
          user.password
        );

        if (!isPasswordValid) {
          return null;
        }

        if (!user.isActive) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
    CredentialsProvider({
      id: "sso",
      name: "SSO",
      credentials: { ssoToken: { label: "SSO Token", type: "text" } },
      async authorize(credentials) {
        if (!credentials?.ssoToken) return null;
        const { default: axios } = await import("axios");
        const { default: https } = await import("https");
        const baseUrl = process.env.SSO_INTERNAL_URL || process.env.SSO_BASE_URL || "";
        try {
          const res = await axios.get(`${baseUrl}/class/checkToken.php`, {
            params: { token: credentials.ssoToken },
            headers: { Host: "sinergy.idbbali.ac.id" },
            httpsAgent: new https.Agent({ rejectUnauthorized: false }),
          });
          if (res.data?.code !== 200) return null;
          const ssoId = String(res.data.idsso);
          let user = await prisma.user.findFirst({ where: { ssoId } });
          if (!user) {
            // Fetch email from SSO database
            const { fetchSSOUserFromDB } = await import("./sso");
            const ssoDbUser = await fetchSSOUserFromDB(ssoId);
            const email = ssoDbUser?.email || null;

            // Check if user already exists by email (link existing account)
            if (email) {
              user = await prisma.user.findUnique({ where: { email } });
              if (user) {
                // Link ssoId to existing user and update name to nama_lengkap
                user = await prisma.user.update({
                  where: { id: user.id },
                  data: {
                    ssoId,
                    ...(ssoDbUser?.nama_lengkap ? { name: ssoDbUser.nama_lengkap } : {}),
                  },
                });
              }
            }

            // Create new user if not found
            if (!user) {
              user = await prisma.user.create({
                data: {
                  name: ssoDbUser?.nama_lengkap || res.data.pengguna,
                  username: res.data.pengguna,
                  email,
                  ssoId,
                  password: "",
                  role: "USER",
                  provider: "sso",
                  isActive: true,
                },
              });
            }
          }
          return { id: user.id, email: user.email, name: user.name, role: user.role };
        } catch { return null; }
      },
    }),

    MicrosoftEntraID({
      clientId: process.env.MICROSOFT_CLIENT_ID!,
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET!,
      issuer: `https://login.microsoftonline.com/${process.env.MICROSOFT_TENANT_ID || "common"}/v2.0`,
      allowDangerousEmailAccountLinking: true,
      authorization: {
        params: {
          scope: "openid profile email User.Read",
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ account, profile }) {
      if (account?.provider === "microsoft-entra-id" && profile?.email) {
        const existingUser = await prisma.user.findUnique({
          where: { email: profile.email },
        });

        if (!existingUser) {
          await prisma.user.create({
            data: {
              email: profile.email,
              name: profile.name || profile.email.split("@")[0],
              role: "USER",
              provider: "microsoft",
              isActive: true,
            },
          });
        } else if (!existingUser.isActive) {
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.role = user.role;
        token.id = user.id;
      }
      if (account?.provider === "microsoft-entra-id" && token.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: token.email },
        });
        if (dbUser) {
          token.role = dbUser.role;
          token.id = dbUser.id;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.role = token.role as string;
        session.user.id = token.id as string;
      }
      return session;
    },
  },
});
