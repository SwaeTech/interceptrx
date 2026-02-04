import { gql } from "@apollo/client";

export const GET_SECRETS = gql`
  query GetSecrets {
    secrets {
      id
      name
      breachCount
      createdAt
      updatedAt
    }
  }
`;

export const GET_SECRET_WITH_TOKEN = gql`
  query GetSecretWithToken($id: ID!) {
    secret(id: $id) {
      id
      name
      token
      breachCount
      createdAt
      updatedAt
    }
  }
`;
