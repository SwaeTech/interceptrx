import { prisma } from "../lib/prisma";
import { envelopeEncrypt, hashWithPepper } from "../lib/encryption";
import { GraphQLError } from "graphql";

export class SecretService {
  async getSecretById(id: string) {
    return await prisma.secret.findUnique({
      where: { id },
    });
  }

  async getAllSecrets() {
    return await prisma.secret.findMany();
  }

  async getSecretCount() {
    return await prisma.secret.count();
  }

  async createSecret(data: {
    name: string;
    token: string;
    userId: string;
    orgId: string;
  }) {
    if (data.token.length < 16) {
      throw new GraphQLError(
        "The secret token must be at least 16 characters long",
        {
          extensions: {
            code: "BAD_USER_INPUT",
            http: { status: 400 },
          },
        },
      );
    }

    const existingSecret = await prisma.secret.findFirst({
      where: {
        name: data.name,
        userId: data.userId,
      },
    });

    if (existingSecret) {
      throw new GraphQLError(
        `A secret with the name "${data.name}" already exists`,
        {
          extensions: {
            code: "BAD_USER_INPUT",
            http: { status: 400 },
          },
        },
      );
    }
    const { encryptedToken, encryptedDek } = envelopeEncrypt(data.token);
    const blindIndex = hashWithPepper(data.token);

    return await prisma.secret.create({
      data: {
        name: data.name,
        encryptedToken: encryptedToken,
        encryptedDek: encryptedDek,
        blindIndex: blindIndex,
        userId: data.userId,
        orgId: data.orgId,
      },
    });
  }

  async checkBreaches(potentialBreaches: string[]): Promise<{
    totalChecked: number;
    breachesFound: number;
    updatedSecrets: string[];
  }> {
    // Hash all potential breaches with pepper
    const hashedBreaches = potentialBreaches.map((token) =>
      hashWithPepper(token),
    );

    // Find all secrets with matching blind indices
    const matchingSecrets = await prisma.secret.findMany({
      where: {
        blindIndex: {
          in: hashedBreaches,
        },
      },
    });

    // Create audit entries for each breach
    const updatedSecretIds: string[] = [];
    for (const secret of matchingSecrets) {
      await prisma.audit.create({
        data: {
          secretId: secret.id,
          userId: secret.userId,
          orgId: secret.orgId,
          action: "BREACH",
          details: "Secret token found in breach database",
        },
      });
      updatedSecretIds.push(secret.id);
    }

    return {
      totalChecked: potentialBreaches.length,
      breachesFound: matchingSecrets.length,
      updatedSecrets: updatedSecretIds,
    };
  }

  async deleteSecret(id: string) {
    return await prisma.secret.delete({
      where: { id },
    });
  }
}

export const secretService = new SecretService();
