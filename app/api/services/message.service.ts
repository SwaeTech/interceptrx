import { hashWithPepper } from "../lib/encryption";
import { secretService } from "./secret.service";
import { GraphQLError } from "graphql";

const OLLAMA_API_URL = process.env.OLLAMA_API_URL || "http://localhost:11434";
const ollamaModel = "llama3.2";

let messages: Array<{ id: string; content: string; role: string }> = [];

export class MessageService {
  getMessages() {
    return messages;
  }

  pepperHashPotentialSecrets(chat: string) {
    const potentialSecrets = chat.split(" ").filter((msg) => {
      if (msg.trim().length > 16) {
        return msg;
      }
    });

    return potentialSecrets;
  }

  async sendMessage(content: string) {
    const newMessage = {
      id: String(messages.length + 1),
      content,
      role: "user",
    };
    messages.push(newMessage);
    return newMessage;
  }

  async *messageStream(
    content: string,
  ): AsyncGenerator<{ content: string; done: boolean; breach?: boolean }> {
    const potentialSecrets = this.pepperHashPotentialSecrets(content);

    // Check for breaches before streaming
    const breachResult = await secretService.checkBreaches(potentialSecrets);

    if (breachResult.breachesFound > 0) {
      // Yield a breach message instead of throwing
      yield {
        content: `⚠️ Breach detected: ${breachResult.breachesFound} secret(s) found in your message. Please remove sensitive tokens to continue.`,
        done: true,
        breach: true,
      };
      return;
    }

    try {
      const response = await fetch(`${OLLAMA_API_URL}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: ollamaModel,
          messages: [
            {
              role: "system",
              content:
                "You are a helpful assistant. Provide clear, coherent responses. Use good grammar, remove duplicate words.",
            },
            { role: "user", content },
          ],
          stream: true,
          options: {
            temperature: 0.7,
            top_p: 0.9,
            repeat_penalty: 1.1,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) throw new Error("No response body");

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          // Signal completion
          yield {
            content: "",
            done: true,
          };
          break;
        }

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n").filter((line) => line.trim());

        for (const line of lines) {
          try {
            const json = JSON.parse(line);
            if (json.message?.content) {
              yield {
                content: json.message.content,
                done: false,
              };
            }
          } catch (e) {
            // Skip malformed JSON
          }
        }
      }
    } catch (error) {
      console.error("Subscription error:", error);
      // Signal error completion
      yield {
        content: "",
        done: true,
      };
    }
  }
}

export const messageService = new MessageService();
