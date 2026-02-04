import { OperationTypeNode } from "graphql";
import {
  ApolloClient,
  ApolloLink,
  HttpLink,
  InMemoryCache,
} from "@apollo/client";
import { SetContextLink } from "@apollo/client/link/context";
import { GraphQLWsLink } from "@apollo/client/link/subscriptions";
import { createClient } from "graphql-ws";

const httpLink = new HttpLink({
  uri: `http://${process.env.NEXT_PUBLIC_API_BASE_URL}/graphql`,
  credentials: "include", // send session cookie for authentication
});

// Add auth token to headers
const authLink = new SetContextLink(() => {
  const token =
    typeof window !== "undefined" ? sessionStorage.getItem("token") : null;

  return {
    headers: {
      authorization: token ? `Bearer ${token}` : "",
    },
  };
});

const wsLink = new GraphQLWsLink(
  createClient({
    url: `ws://${process.env.NEXT_PUBLIC_API_BASE_URL}/graphql`,
    connectionParams: () => {
      const token =
        typeof window !== "undefined" ? sessionStorage.getItem("token") : null;
      return {
        authorization: token ? `Bearer ${token}` : "",
      };
    },
  }),
);

const splitLink = ApolloLink.split(
  ({ operationType }) => {
    return operationType === OperationTypeNode.SUBSCRIPTION;
  },
  wsLink,
  authLink.concat(httpLink),
);

const client = new ApolloClient({
  link: splitLink,
  cache: new InMemoryCache(),
});

export default client;
