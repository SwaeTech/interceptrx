import gql from "graphql-tag";

export const userTypeDefs = gql`
  type User {
    id: ID!
    email: String!
    name: String
    scopes: [String!]!
    orgId: String!
    createdAt: String!
    updatedAt: String!
  }

  type AuthPayload {
    token: String!
    user: User!
  }

  extend type Query {
    me: User
  }

  extend type Mutation {
    login(email: String!, password: String!): AuthPayload!
    logout: Boolean!
  }
`;
