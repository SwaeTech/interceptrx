import Credentials from "next-auth/providers/credentials";

export const authConfig = {
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        // hardcoded users for demonstration purposes
        // could go either way credentials or Oauth flow by having scopes here
        if (
          credentials?.email === "admin1@example.com" &&
          credentials?.password === "password"
        ) {
          return {
            id: "1",
            email: "admin1@example.com",
            name: "Admin User",
            scopes: ["admin", "org:org1"],
          };
        } else if (
          credentials?.email === "admin2@example.com" &&
          credentials?.password === "password"
        ) {
          return {
            id: "1",
            email: "admin2@example.com",
            name: "Admin User",
            scopes: ["admin", "org:org2"],
          };
        } else if (
          credentials?.email === "manager@example.com" &&
          credentials?.password === "password"
        ) {
          return {
            id: "2",
            email: "manager@example.com",
            name: "Regular User",
            scopes: ["manager", "org:org1"],
          };
        } else if (
          credentials?.email === "viewer@example.com" &&
          credentials?.password === "password"
        ) {
          return {
            id: "3",
            email: "viewer@example.com",
            name: "Regular User",
            scopes: ["viewer", "org:org1"],
          };
        }
        return null;
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async signIn(params: {
      user: any;
      account: any | null;
      profile?: any;
      email?: { verificationRequest?: boolean };
      credentials?: Record<string, unknown>;
    }) {
      // Allow sign in for all users that pass authorize
      return true;
    },
    async session(params: { session: any; token: any; user?: any }) {
      const { session, token } = params;
      if (token && session.user) {
        session.user.id = token.id;
        session.user.scopes = token.scopes;
      }
      return session;
    },
    async jwt(params: {
      token: any;
      user?: any;
      account?: any;
      profile?: any;
      isNewUser?: boolean;
    }) {
      const { token, user } = params;
      if (user) {
        token.id = user.id;
        token.scopes = user.scopes;
      }
      return token;
    },
  },
};
