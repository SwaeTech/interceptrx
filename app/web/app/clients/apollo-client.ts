import { OperationTypeNode } from "graphql";
import {
  ApolloClient,
  ApolloLink,
  HttpLink,
  InMemoryCache,
} from "@apollo/client";
import { GraphQLWsLink } from "@apollo/client/link/subscriptions";
import { createClient } from "graphql-ws";

const httpLink = new HttpLink({
  uri: `http://${process.env.NEXT_PUBLIC_API_BASE_URL}/graphql`,
  credentials: "include", // send session cookie for authentication
});
const wsLink = new GraphQLWsLink(
  createClient({
    url: `ws://${process.env.NEXT_PUBLIC_API_BASE_URL}/graphql`,
  }),
);

const splitLink = ApolloLink.split(
  ({ operationType }) => {
    return operationType === OperationTypeNode.SUBSCRIPTION;
  },
  wsLink,
  httpLink,
);

const client = new ApolloClient({
  link: splitLink,
  cache: new InMemoryCache(),
});

export default client;
