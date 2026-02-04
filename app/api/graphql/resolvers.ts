import { merge } from "lodash-es";
import { messageResolvers } from "./resolvers/message.js";
import { secretResolvers } from "./resolvers/secret.js";

// Merge all resolvers
export const resolvers = merge({}, messageResolvers, secretResolvers);
