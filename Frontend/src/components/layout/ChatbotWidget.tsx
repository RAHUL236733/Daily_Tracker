import { useEffect, useRef, useState } from "react";
import { Expand, RefreshCw, Send, X } from "lucide-react";

interface ChatbotWidgetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Message {
  id: string;
  text: string;
  sender: "user" | "bot";
}

export function ChatbotWidget({ isOpen, onOpenChange }: ChatbotWidgetProps) {
  const initialMessages = useRef<Message[]>([
    { id: "1", text: "Hello! How can I help you today?", sender: "bot" },
    { id: "2", text: "Ask me anything...", sender: "bot" },
  ]).current;
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent | TouchEvent) {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        onOpenChange(false);
      }
    }

    if (!isOpen) return;

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
    };
  }, [isOpen, onOpenChange]);

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage = {
      id: Date.now().toString(),
      text: input,
      sender: "user" as const,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    setTimeout(() => {
      const botResponse = {
        id: (Date.now() + 1).toString(),
        text: "Thanks for your message. I can help you keep track of tasks, habits, and reminders.",
        sender: "bot" as const,
      };
      setMessages((prev) => [...prev, botResponse]);
    }, 500);
  };

  const handleReset = () => {
    setMessages(initialMessages);
    setInput("");
    scrollToBottom();
  };

  if (!isOpen) return null;

  const panelSize = isExpanded ? "md:w-[28vw] lg:w-[24vw]" : "md:w-[24vw] lg:w-[20vw]";

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        aria-label="Close chatbot overlay"
        className="absolute inset-0 cursor-default bg-background/25 backdrop-blur-[1px]"
        onClick={() => onOpenChange(false)}
      />

      <div
        ref={panelRef}
        className={`absolute right-0 top-0 flex h-dvh w-full ${panelSize} origin-right flex-col overflow-hidden border-l border-border bg-card text-card-foreground shadow-elevated transition-all duration-300 ease-out animate-assistant-float-in md:right-4 md:top-4 md:h-[calc(100dvh-2rem)] md:rounded-[28px] md:border`}
      >
        <div className="flex items-center justify-between border-b border-border bg-gradient-to-r from-primary to-[oklch(0.66_0.13_220)] px-5 py-4 text-primary-foreground">
          <div className="flex items-start gap-3">
            <div className="mt-1 flex h-3 w-3 shrink-0 rounded-full bg-success shadow-[0_0_0_3px_rgba(16,185,129,0.2)]" />
            <div>
              <h3 className="text-sm font-semibold leading-none">Chat Assistant</h3>
              <p className="mt-1 text-xs text-primary-foreground/80">
                Open on the right side of every page
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-primary-foreground/90">
            <button
              type="button"
              onClick={handleReset}
              className="rounded-full p-1 transition hover:bg-primary-foreground/15 active:scale-95"
              aria-label="Refresh chat"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setIsExpanded((value) => !value)}
              className="rounded-full p-1 transition hover:bg-primary-foreground/15 active:scale-95"
              aria-label="Expand chat"
            >
              <Expand className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="rounded-full p-1 transition hover:bg-primary-foreground/15 active:scale-95"
              aria-label="Close chatbot"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto bg-background p-5 text-foreground">
          <div className="rounded-2xl border border-border bg-card p-4 text-sm text-muted-foreground shadow-soft">
            Ask about habits, tasks, reminders, or progress. The assistant stays fixed on the right
            while you move through the app.
          </div>
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm leading-5 ${
                  msg.sender === "user"
                    ? "ml-auto bg-primary text-primary-foreground"
                    : "border border-border bg-muted text-foreground"
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <div className="border-t border-border bg-card p-4">
          <div className="flex gap-2 rounded-2xl border border-border bg-background p-2 shadow-soft">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Ask me anything..."
              className="min-w-0 flex-1 bg-transparent px-2 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground"
            />
            <button
              onClick={handleSend}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground transition hover:opacity-90 active:scale-95"
              aria-label="Send message"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
