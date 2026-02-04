import { prisma } from "../../lib/prisma";
import jwt from "jsonwebtoken";
import { GraphQLError } from "graphql";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-this";
const JWT_EXPIRES_IN = "7d";

export const userResolvers = {
  Query: {
    me: async (_: any, __: any, context: any) => {
      if (!context.user) {
        throw new GraphQLError("Not authenticated", {
          extensions: { code: "UNAUTHENTICATED" },
        });
      }

      return await prisma.user.findUnique({
        where: { id: context.user.id },
      });
    },
  },
  Mutation: {
    login: async (
      _: any,
      { email, password }: { email: string; password: string },
      context: any
    ) => {
      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user || user.password !== password) {
        throw new GraphQLError("Invalid credentials", {
          extensions: { code: "UNAUTHORIZED" },
        });
      }

      // Generate JWT token
      const token = jwt.sign(
        {
          id: user.id,
          email: user.email,
          scopes: user.scopes,
          orgId: user.orgId,
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      );

      // Set HTTP-only cookie
      context.res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      return {
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          scopes: user.scopes,
          orgId: user.orgId,
        },
      };
    },
    logout: async (_: any, __: any, context: any) => {
      context.res.clearCookie("token");
      return true;
    },
  },
};
