import { gql } from "@apollo/client";

export const MESSAGE_STREAM_SUBSCRIPTION = gql`
  subscription MessageStream($content: String!) {
    messageStream(content: $content) {
      content
      done
      breach
    }
  }
`;
