import { gql } from "graphql-tag";
import { messageTypeDefs } from "./type-defs/message";
import { secretTypeDefs } from "./type-defs/secret";
import { userTypeDefs } from "./type-defs/user";
import { auditTypeDefs } from "./type-defs/audit";

// Base schema with empty root types
const baseTypeDefs = gql`
  type Query
  type Mutation
  type Subscription
`;

export const typeDefs = [baseTypeDefs, messageTypeDefs, secretTypeDefs, userTypeDefs, auditTypeDefs];
