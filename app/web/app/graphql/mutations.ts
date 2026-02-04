import { gql } from "@apollo/client";

export const LOGIN = gql`
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      token
      user {
        id
        email
        name
        scopes
        orgId
      }
    }
  }
`;

export const LOGOUT = gql`
  mutation Logout {
    logout
  }
`;

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
