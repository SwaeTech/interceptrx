import { rule, shield } from "graphql-shield";
import { GraphQLError } from "graphql";
import { defineAbilitiesFor } from "../lib/abilities";

// Define authorization rules
const isAuthenticated = rule({ cache: "contextual" })(async (
  parent,
  args,
  ctx,
) => {
  return ctx.user !== null;
});

const isAdmin = rule({ cache: "contextual" })(async (parent, args, ctx) => {
  try {
    const ability = defineAbilitiesFor(ctx.user);

    const canCreate = ability.can("create", "Secret");

    if (!canCreate) {
      throw new GraphQLError("Only admin users can perform this action", {
        extensions: {
          code: "FORBIDDEN",
          http: { status: 403 },
        },
      });
    }
    return true;
  } catch (error) {
    throw error;
  }
});

const isManager = rule({ cache: "contextual" })(async (parent, args, ctx) => {
  const ability = defineAbilitiesFor(ctx.user);
  if (!ability.can("read", "Secret")) {
    throw new GraphQLError("Only manager users can perform this action", {
      extensions: {
        code: "FORBIDDEN",
        http: { status: 403 },
      },
    });
  }
  return true;
});

// Apply rules to schema (alternative to directive-based RBAC)
export const permissions = shield(
  {
    Query: {
      secret: isManager || isAdmin,
      secrets: isManager || isAdmin,
      secretCount: isManager || isAdmin,
    },
    Mutation: {
      createSecret: isAdmin,
    },
    Secret: {
      token: isAdmin,
    },
  },
  {
    allowExternalErrors: true, // Allow errors from resolvers to pass through
    fallbackError: new GraphQLError("Not authorized", {
      extensions: {
        code: "FORBIDDEN",
        http: { status: 403 },
      },
    }),
  },
);
