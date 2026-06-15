"use server";

import { createClient } from "@/lib/supabase/server";

// Default to a current free-tier model. gemini-2.0-flash was retired on
// 2026-06-01, so 2.5-flash is the safe baseline. Override with GEMINI_MODEL.
const GEMINI_MODEL = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";

const SYSTEM_INSTRUCTION =
  "You are PromptVault's prompt-engineering assistant. Help the user iteratively craft and " +
  "optimize an AI prompt for maximum LLM performance. Suggest concrete improvements — a clear role, " +
  "an explicit task, useful context, constraints, and an output format — and ask brief clarifying " +
  "questions only when genuinely needed. Whenever you present a ready-to-use prompt, output it as a " +
  "single fenced ``` code block so it can be copied directly. Keep replies concise.";

// Gemini only accepts these two roles in `contents`.
export interface ChatMessage {
  role: "user" | "model";
  text: string;
}

export type ChatResult =
  | { ok: true; reply: string }
  | { ok: false; error: string };

// Abuse / cost guards. The draft cap mirrors the prompts.body limit.
const MAX_DRAFT = 5000;
const MAX_MESSAGES = 40;
const MAX_TOTAL_CHARS = 20_000;

/**
 * Hold a multi-turn conversation with Gemini to help the user refine a prompt.
 *
 * Runs only on the server: the API key lives in GEMINI_API_KEY (never exposed
 * to the client) and is sent via the x-goog-api-key header so it stays out of
 * URLs and request logs. Server Actions are reachable via direct POST, so we
 * re-verify the session here rather than trusting the caller.
 *
 * `draft` is the user's current prompt text; it's injected into the system
 * instruction so the assistant always has the latest context, regardless of
 * how the conversation started.
 */
export async function enhanceChat(
  messages: ChatMessage[],
  draft: string,
): Promise<ChatResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "You must be logged in to use the enhancer." };
  }

  if (!Array.isArray(messages) || messages.length === 0) {
    return { ok: false, error: "Type a message to get started." };
  }
  if (messages.length > MAX_MESSAGES) {
    return { ok: false, error: "This conversation is too long. Start a new one." };
  }

  const cleaned: ChatMessage[] = [];
  let totalChars = 0;
  for (const message of messages) {
    const role = message?.role === "model" ? "model" : "user";
    const text = String(message?.text ?? "").trim();
    if (!text) continue;
    totalChars += text.length;
    cleaned.push({ role, text });
  }

  if (cleaned.length === 0) {
    return { ok: false, error: "Type a message to get started." };
  }
  if (totalChars > MAX_TOTAL_CHARS) {
    return { ok: false, error: "This conversation is too long. Start a new one." };
  }
  // Gemini requires the first turn to be from the user.
  if (cleaned[0].role !== "user") {
    return { ok: false, error: "Something went wrong. Please try again." };
  }

  const trimmedDraft = String(draft ?? "")
    .slice(0, MAX_DRAFT)
    .trim();
  const systemInstruction = trimmedDraft
    ? `${SYSTEM_INSTRUCTION}\n\nThe user's current prompt draft is:\n"""\n${trimmedDraft}\n"""`
    : `${SYSTEM_INSTRUCTION}\n\nThe user has not written a draft yet.`;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("enhanceChat: GEMINI_API_KEY is not set.");
    return { ok: false, error: "The AI enhancer isn't configured yet." };
  }

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemInstruction }] },
          contents: cleaned.map((message) => ({
            role: message.role,
            parts: [{ text: message.text }],
          })),
        }),
        // Don't let a slow upstream hang the action indefinitely.
        signal: AbortSignal.timeout(30_000),
      },
    );

    if (!res.ok) {
      // Never surface the upstream body — it can echo back request details.
      console.error("enhanceChat: Gemini responded with", res.status);
      return {
        ok: false,
        error: "Couldn't reach the AI enhancer right now. Please try again.",
      };
    }

    const data = (await res.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };

    const reply = data.candidates?.[0]?.content?.parts
      ?.map((part) => part.text ?? "")
      .join("")
      .trim();

    if (!reply) {
      return {
        ok: false,
        error: "The assistant didn't return a response. Try rephrasing.",
      };
    }

    return { ok: true, reply };
  } catch (err) {
    console.error("enhanceChat failed:", err);
    return {
      ok: false,
      error: "Couldn't reach the AI enhancer. Please try again.",
    };
  }
}
