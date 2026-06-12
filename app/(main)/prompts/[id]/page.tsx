import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SquarePen } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getPrompt, getRelatedPrompts } from "@/lib/data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { CopyButton } from "@/components/prompts/copy-button";
import { ShareButton } from "@/components/prompts/share-button";
import { UpvoteButton } from "@/components/prompts/upvote-button";
import { DeletePromptButton } from "@/components/prompts/delete-prompt-button";
import { PromptCard } from "@/components/prompts/prompt-card";
import { ToastOnLoad } from "@/components/toast-on-load";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const prompt = await getPrompt(id, undefined);
  if (!prompt) {
    return { title: "Prompt not found — PromptVault" };
  }

  const description =
    prompt.body.length > 160 ? `${prompt.body.slice(0, 157)}…` : prompt.body;

  return {
    title: `${prompt.title} — PromptVault`,
    description,
    openGraph: {
      title: prompt.title,
      description,
      type: "article",
    },
  };
}

export default async function PromptDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const toastValue = typeof sp.toast === "string" ? sp.toast : null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const prompt = await getPrompt(id, user?.id);
  if (!prompt) notFound();

  const isOwner = !!user && prompt.user_id === user.id;
  const related = await getRelatedPrompts(prompt.id, prompt.category, user?.id);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8">
      <Link
        href="/"
        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        ← Back to prompts
      </Link>

      <div className="mt-4 flex flex-col gap-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-2">
            <Badge variant="secondary" className="w-fit">
              {prompt.category}
            </Badge>
            <h1 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
              {prompt.title}
            </h1>
            <p className="text-sm text-muted-foreground">
              by{" "}
              {prompt.author ? (
                <Link
                  href={`/profiles/${prompt.author}`}
                  className="font-medium hover:underline"
                >
                  {prompt.author}
                </Link>
              ) : (
                "anonymous"
              )}{" "}
              · {formatDate(prompt.created_at)}
            </p>
          </div>
          <UpvoteButton
            promptId={prompt.id}
            count={prompt.upvotes}
            hasUpvoted={prompt.hasUpvoted}
            isAuthenticated={!!user}
          />
        </div>

        <Card>
          <CardContent>
            <pre className="font-sans text-sm break-words whitespace-pre-wrap">
              {prompt.body}
            </pre>
          </CardContent>
          <CardFooter className="justify-between gap-2">
            <div className="flex items-center gap-2">
              <CopyButton text={prompt.body} />
              <ShareButton promptId={prompt.id} />
            </div>
            {isOwner && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  render={<Link href={`/prompts/${prompt.id}/edit`} />}
                >
                  <SquarePen />
                  Edit
                </Button>
                <DeletePromptButton
                  id={prompt.id}
                  title={prompt.title}
                  variant="full"
                />
              </div>
            )}
          </CardFooter>
        </Card>

        {related.length > 0 && (
          <section className="mt-6 flex flex-col gap-4">
            <h2 className="font-heading text-lg font-semibold tracking-tight">
              More in {prompt.category}
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((relatedPrompt) => (
                <PromptCard
                  key={relatedPrompt.id}
                  prompt={relatedPrompt}
                  isAuthenticated={!!user}
                  isOwner={!!user && relatedPrompt.user_id === user.id}
                />
              ))}
            </div>
          </section>
        )}
      </div>

      <ToastOnLoad value={toastValue} />
    </div>
  );
}
