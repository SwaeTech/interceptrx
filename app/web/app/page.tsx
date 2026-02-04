"use client";

import { useState, useRef, useEffect } from "react";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import apolloClient from "./clients/apollo-client";
import { MESSAGE_STREAM_SUBSCRIPTION } from "./graphql/subscriptions";

export default function Home() {
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<
    Array<{ role: string; content: string; isBreach?: boolean }>
  >([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Clean up duplicate characters/words from Ollama output
  const cleanContent = (text: string): string => {
    let cleaned = text;
    cleaned = cleaned.replace(/(.)\1+/g, "$1");
    cleaned = cleaned.replace(/('[a-z]+)\1/gi, "$1");
    cleaned = cleaned.replace(/\b(\w+)\s+\1\b/gi, "$1");
    cleaned = cleaned.replace(/(\w{2,})(\1)/g, "$1");
    return cleaned;
  };

  const handleSubmit = async (e: { preventDefault: () => void }) => {
    e.preventDefault();
    if (!message.trim() || isLoading) return;

    const userMessage = message;
    setMessage("");

    // Add user message
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);

    // Add empty assistant message for streaming
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    setIsLoading(true);

    // Subscribe to the message stream
    const subscription = apolloClient
      .subscribe({
        query: MESSAGE_STREAM_SUBSCRIPTION,
        variables: { content: userMessage },
      })
      .subscribe({
        next: ({ data }: any) => {
          if (data?.messageStream) {
            const { content, done, breach } = data.messageStream;

            setMessages((prev) => {
              const lastMessage = prev[prev.length - 1];
              if (!lastMessage || lastMessage.role !== "assistant") {
                return [
                  ...prev,
                  { role: "assistant", content: "", isBreach: breach },
                ];
              }
              return prev;
            });

            setMessages((prev) => {
              const newMessages = [...prev];
              const lastMessage = newMessages[newMessages.length - 1];

              if (lastMessage && lastMessage.role === "assistant") {
                // If this is a breach message (done immediately), replace instead of append
                if (breach && done) {
                  lastMessage.content = content;
                  lastMessage.isBreach = true;
                } else {
                  lastMessage.content += content;
                  lastMessage.content = cleanContent(lastMessage.content);
                }
              }

              return newMessages;
            });

            if (done) {
              setIsLoading(false);
              subscription.unsubscribe();
            }
          }
        },
        error: (error) => {
          console.error("Subscription error:", error);
          setIsLoading(false);
          subscription.unsubscribe();
        },
      });
  };

  return (
    <div className="flex h-screen bg-white">
      <Sidebar expanded={sidebarExpanded} />
      <div className="flex flex-col flex-1 h-full">
        <Header expanded={sidebarExpanded} setExpanded={setSidebarExpanded} />
        <main className="flex-1 overflow-y-auto px-4 py-6 mt-14.25 mb-18.25">
          <div className="mx-auto w-full max-w-3xl space-y-4">
            {messages.length === 0 ? (
              <div className="text-center">
                <h2 className="mb-8 text-4xl font-semibold text-gray-900">
                  Welcome to your protected chat assistant
                </h2>
              </div>
            ) : (
              messages.map((msg, index) => (
                <div
                  key={index}
                  className={`rounded-lg p-4 ${
                    msg.role === "user"
                      ? "bg-gray-100 ml-auto max-w-[80%]"
                      : msg.isBreach
                        ? "bg-red-100 border-2 border-red-400 mr-auto max-w-[80%]"
                        : "bg-sky-200/50 mr-auto max-w-[80%]"
                  }`}
                >
                  <p className="text-sm font-semibold text-gray-700 mb-1">
                    {msg.role === "user" ? "You" : "InterceptRx"}
                  </p>
                  <p
                    className={`whitespace-pre-wrap ${msg.isBreach ? "text-red-700 font-semibold" : "text-gray-900"}`}
                  >
                    {msg.content}
                  </p>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
        </main>
        <div className="border-t border-gray-200 bg-white px-4 py-4">
          <div className="mx-auto w-full max-w-3xl">
            <form
              onSubmit={handleSubmit}
              className="relative flex items-center"
            >
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Message InterceptRx..."
                disabled={isLoading}
                className="w-full rounded-full border text-black border-gray-300 px-6 py-3 pr-12 shadow-sm focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400 disabled:bg-gray-100"
              />
              <button
                type="submit"
                disabled={isLoading || !message.trim()}
                className="absolute right-3 rounded-full bg-gray-200 p-2 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  className="text-gray-600"
                >
                  <path
                    d="M7 11L12 6L17 11M12 18V7"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
