"use client";

import { ApolloProvider as Provider } from "@apollo/client/react";
import { useEffect } from "react";
import { client } from "../clients/apollo-client";
import { useAuth } from "../../lib/auth-provider";

export function ApolloProvider({ children }: { children: React.ReactNode }) {
  const { setApolloClient } = useAuth();

  useEffect(() => {
    setApolloClient(client);
  }, [setApolloClient]);

  return <Provider client={client}>{children}</Provider>;
}
