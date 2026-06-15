"use client";

import { useEffect, useRef, useState } from "react";
import { LoaderCircle, Send, Sparkles, WandSparkles } from "lucide-react";
import { toast } from "sonner";
import { enhanceChat, type ChatMessage } from "@/app/prompts/enhance";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface EnhanceDialogProps {
  /** The current prompt body — given to the assistant as context. */
  draft: string;
  /** Called when the user accepts a suggested prompt. Caller is responsible for any side-effects and toast. */
  onApply: (text: string) => void;
  /** Label for the accept button inside each assistant message. Default: "Insert into prompt". */
  applyLabel?: string;
}

/**
 * Pull the last fenced ``` code block out of an assistant message (that's
 * where the system instruction asks it to put ready-to-use prompts). Falls
 * back to the whole message when there's no code block.
 */
function extractPrompt(text: string): string {
  const matches = [...text.matchAll(/```(?:[a-zA-Z]*)?\n?([\s\S]*?)```/g)];
  const last = matches.at(-1);
  return (last ? last[1] : text).trim();
}

export function EnhanceDialog({ draft, onApply, applyLabel = "Insert into prompt" }: EnhanceDialogProps) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Keep the latest message in view.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, sending]);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || sending) return;

    const next: ChatMessage[] = [...messages, { role: "user", text: trimmed }];
    setMessages(next);
    setInput("");
    setSending(true);
    try {
      const result = await enhanceChat(next, draft);
      if (result.ok) {
        setMessages((prev) => [...prev, { role: "model", text: result.reply }]);
      } else {
        // Roll back the optimistic user turn so they can retry it.
        setMessages((prev) => prev.slice(0, -1));
        setInput(trimmed);
        toast.error(result.error);
      }
    } finally {
      setSending(false);
    }
  }

  function handleApply(text: string) {
    onApply(extractPrompt(text));
    setOpen(false);
  }

  const canSuggest = draft.trim().length >= 10;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={<Button type="button" variant="outline" size="sm" />}
      >
        <Sparkles />
        Enhance with AI
      </DialogTrigger>
      <DialogContent className="flex max-h-[85vh] flex-col gap-0 p-0 sm:max-w-lg">
        <DialogHeader className="border-b p-4">
          <DialogTitle className="flex items-center gap-2">
            <WandSparkles className="size-4 text-primary" />
            Enhance with AI
          </DialogTitle>
          <DialogDescription>
            Chat with Gemini to refine your prompt, then insert the result.
          </DialogDescription>
        </DialogHeader>

        <div
          ref={scrollRef}
          className="flex min-h-48 flex-1 flex-col gap-3 overflow-y-auto p-4"
        >
          {messages.length === 0 && (
            <div className="m-auto flex max-w-xs flex-col items-center gap-3 text-center">
              <p className="text-sm text-muted-foreground">
                Ask for improvements, a rewrite, or extra constraints. Anything
                inside a code block can be inserted straight into your prompt.
              </p>
              <Button
                type="button"
                size="sm"
                disabled={!canSuggest || sending}
                onClick={() => send("Suggest an optimized version of my current prompt.")}
              >
                <Sparkles />
                Suggest an enhanced version
              </Button>
              {!canSuggest && (
                <p className="text-xs text-muted-foreground">
                  Write at least 10 characters in your prompt first, or just ask
                  a question below.
                </p>
              )}
            </div>
          )}

          {messages.map((message, index) => (
            <div
              key={index}
              className={
                message.role === "user"
                  ? "max-w-[85%] self-end rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground"
                  : "max-w-[90%] self-start rounded-lg bg-muted px-3 py-2 text-sm"
              }
            >
              <p className="whitespace-pre-wrap break-words">{message.text}</p>
              {message.role === "model" && (
                <Button
                  type="button"
                  variant="outline"
                  size="xs"
                  className="mt-2"
                  onClick={() => handleApply(message.text)}
                >
                  {applyLabel}
                </Button>
              )}
            </div>
          ))}

          {sending && (
            <div className="flex items-center gap-2 self-start rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">
              <LoaderCircle className="size-4 animate-spin" />
              Thinking…
            </div>
          )}
        </div>

        <form
          className="flex items-end gap-2 border-t p-3"
          onSubmit={(event) => {
            event.preventDefault();
            send(input);
          }}
        >
          <Textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                send(input);
              }
            }}
            placeholder="Ask for an improvement…  (Enter to send, Shift+Enter for newline)"
            className="max-h-32 min-h-10 flex-1 resize-none"
            maxLength={2000}
            disabled={sending}
          />
          <Button
            type="submit"
            size="icon"
            aria-label="Send message"
            disabled={sending || input.trim().length === 0}
          >
            {sending ? (
              <LoaderCircle className="animate-spin" />
            ) : (
              <Send />
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
