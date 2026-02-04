import gql from "graphql-tag";

export const auditTypeDefs = gql`
  type Audit {
    id: ID!
    secretId: String!
    userId: String!
    orgId: String!
    action: String!
    details: String
    createdAt: String!
  }

  extend type Query {
    audits: [Audit!]!
  }
`;
