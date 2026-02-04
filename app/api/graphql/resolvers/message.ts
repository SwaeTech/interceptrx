import { messageService } from "../../services/message.service";

export const messageResolvers = {
  Query: {
    messages: () => messageService.getMessages(),
  },
  Mutation: {
    sendMessage: async (_: any, { content }: { content: string }) => {
      return await messageService.sendMessage(content);
    },
  },
  Subscription: {
    messageStream: {
      subscribe: async function* (
        _: any,
        { content }: { content: string },
      ): AsyncGenerator<{
        messageStream: { content: string; done: boolean; breach?: boolean };
      }> {
        for await (const chunk of messageService.messageStream(content)) {
          yield { messageStream: chunk };
        }
      },
    },
  },
};
