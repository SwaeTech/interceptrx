import { gql } from "graphql-tag";

export const secretTypeDefs = gql`
  type Secret {
    id: ID!
    name: String!
    breachCount: Int!
    token: String!
    createdAt: String!
    updatedAt: String!
  }

  extend type Query {
    secret(id: ID!): Secret
    secrets: [Secret!]!
    secretCount: Int!
  }

  extend type Mutation {
    createSecret(name: String!, token: String!): Secret!
  }
`;
