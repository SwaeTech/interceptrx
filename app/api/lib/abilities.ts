import { AbilityBuilder, PureAbility } from "@casl/ability";
import { PrismaQuery, Subjects, createPrismaAbility } from "@casl/prisma";

export type Actions = "create" | "read" | "update" | "delete" | "manage";
export type AppSubjects = Subjects<{
  Secret: { orgId: string; userId: string };
}>;

export type AppAbility = PureAbility<[Actions, AppSubjects], PrismaQuery>;

export const defineAbilitiesFor = (
  user: { scopes: string[]; id: string; orgId: string } | null,
) => {
  const { can, build } = new AbilityBuilder<AppAbility>(createPrismaAbility);

  if (!user) {
    // users must be logged in to be able to do anything
    return build();
  }

  if (user.scopes?.includes("admin")) {
    can("read", "Secret", { orgId: user.orgId });
    can("create", "Secret");
    can("update", "Secret", { userId: user.id, orgId: user.orgId });
  } else if (user.scopes?.includes("manager")) {
    // manager can only read secrets in their org
    can("read", "Secret", { orgId: user.orgId });
  } else if (user.scopes?.includes("viewer")) {
    // viewers can only chat and have no secret visibility
  }

  const ability = build();
  return ability;
};
