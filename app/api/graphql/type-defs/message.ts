import { gql } from "graphql-tag";

export const messageTypeDefs = gql`
  type Message {
    id: ID!
    content: String!
    role: String!
  }

  type MessageChunk {
    content: String!
    done: Boolean!
    breach: Boolean
  }

  extend type Query {
    messages: [Message!]!
  }

  extend type Mutation {
    sendMessage(content: String!): Message!
  }

  extend type Subscription {
    messageStream(content: String!): MessageChunk!
  }
`;
