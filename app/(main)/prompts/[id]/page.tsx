import Link from "next/link";
import { notFound } from "next/navigation";
import { SquarePen } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getPrompt } from "@/lib/data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { CopyButton } from "@/components/prompts/copy-button";
import { UpvoteButton } from "@/components/prompts/upvote-button";
import { DeletePromptButton } from "@/components/prompts/delete-prompt-button";
import { ToastOnLoad } from "@/components/toast-on-load";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
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
              by {prompt.author ?? "anonymous"} · {formatDate(prompt.created_at)}
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
            <CopyButton text={prompt.body} />
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
      </div>

      <ToastOnLoad value={toastValue} />
    </div>
  );
}
