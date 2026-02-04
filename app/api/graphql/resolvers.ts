import { merge } from "lodash-es";
import { messageResolvers } from "./resolvers/message.js";
import { secretResolvers } from "./resolvers/secret.js";
import { userResolvers } from "./resolvers/user.js";
import { auditResolvers } from "./resolvers/audit.js";

// Merge all resolvers
export const resolvers = merge({}, messageResolvers, secretResolvers, userResolvers, auditResolvers);
