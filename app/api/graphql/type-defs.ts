import { gql } from "graphql-tag";
import { messageTypeDefs } from "./type-defs/message";
import { secretTypeDefs } from "./type-defs/secret";

// Base schema with empty root types
const baseTypeDefs = gql`
  type Query
  type Mutation
  type Subscription
`;

export const typeDefs = [baseTypeDefs, messageTypeDefs, secretTypeDefs];
