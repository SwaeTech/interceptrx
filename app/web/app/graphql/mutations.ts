import { gql } from "@apollo/client";

export const CREATE_SECRET = gql`
  mutation CreateSecret($name: String!, $token: String!) {
    createSecret(name: $name, token: $token) {
      id
      name
      createdAt
      updatedAt
    }
  }
`;
