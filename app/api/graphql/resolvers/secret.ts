import { secretService } from "../../services/secret.service";
import { envelopeDecrypt } from "../../lib/encryption";
import { defineAbilitiesFor } from "../../lib/abilities";
import { prisma } from "../../lib/prisma";
import { accessibleBy } from "@casl/prisma";

export const secretResolvers = {
  // Field-level resolvers
  Secret: {
    token: (parent: any) => {
      if (!parent.encryptedToken || !parent.encryptedDek) {
        throw new Error("Encrypted token or DEK is missing");
      }
      return envelopeDecrypt(parent.encryptedToken, parent.encryptedDek);
    },

    breachCount: async (parent: any) => {
      // Count audit entries with action 'BREACH' for this secret
      const count = await prisma.audit.count({
        where: {
          secretId: parent.id,
          action: "BREACH",
        },
      });
      return count;
    },
    
    createdAt: (parent: any) => parent.createdAt.toISOString(),
    updatedAt: (parent: any) => parent.updatedAt.toISOString(),
  },

  // root level resolvers
  Query: {
    secret: async (_parent: undefined, args: { id: string }) => {
      return await secretService.getSecretById(args.id);
    },

    // secrets returned at the organization level for viewing purposes based on user scopes
    secrets: async (
      _parent: undefined,
      _args: any,
      ctx: {
        user: {
          id: string;
          email: string;
          scopes: string[];
          orgId: string;
        } | null;
      },
    ) => {
      if (!ctx.user) {
        return [];
      }

      const ability = defineAbilitiesFor(ctx.user);

      // Use @casl/prisma to automatically convert abilities to Prisma where clause
      const secrets = await prisma.secret.findMany({
        where: accessibleBy(ability, "read").Secret,
      });

      return secrets;
    },

    secretCount: async () => {
      return await secretService.getSecretCount();
    },
  },

  Mutation: {
    createSecret: async (
      _parent: undefined,
      args: { name: string; token: string },
      context: { user: { id: string; email: string; scopes: string[] } },
    ) => {
      // Extract orgId from scopes
      const orgScope = context.user.scopes.find((scope) =>
        scope.startsWith("org:"),
      );
      const orgId = orgScope ? orgScope.split(":")[1] : "";

      // Use authenticated user ID from session context
      return await secretService.createSecret({
        name: args.name,
        token: args.token,
        userId: context.user.email,
        orgId: orgId,
      });
    },
  },
};
