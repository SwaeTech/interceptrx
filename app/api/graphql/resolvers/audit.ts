import { prisma } from "../../lib/prisma";
import { defineAbilitiesFor } from "../../lib/abilities";
import { accessibleBy } from "@casl/prisma";

export const auditResolvers = {
  Audit: {
    createdAt: (parent: any) => parent.createdAt.toISOString(),
  },

  Query: {
    audits: async (
      _parent: undefined,
      _args: any,
      ctx: {
        user: {
          id: string;
          email: string;
          scopes: string[];
          orgId: string;
        } | null;
      }
    ) => {
      if (!ctx.user) {
        return [];
      }

      const ability = defineAbilitiesFor(ctx.user);

      // Return audits filtered by user's abilities
      return await prisma.audit.findMany({
        where: accessibleBy(ability).Audit,
        orderBy: {
          createdAt: "desc",
        },
        take: 100, // Limit to last 100 audits
      });
    },
  },
};
