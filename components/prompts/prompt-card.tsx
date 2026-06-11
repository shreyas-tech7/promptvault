import Link from "next/link";
import { SquarePen } from "lucide-react";
import type { PromptWithMeta } from "@/lib/types";
import {
  Card,
  CardAction,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/prompts/copy-button";
import { UpvoteButton } from "@/components/prompts/upvote-button";
import { DeletePromptButton } from "@/components/prompts/delete-prompt-button";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function PromptCard({
  prompt,
  isAuthenticated,
  isOwner,
}: {
  prompt: PromptWithMeta;
  isAuthenticated: boolean;
  isOwner: boolean;
}) {
  return (
    <Card className="h-full">
      <CardHeader>
        <Badge variant="secondary" className="mb-1">
          {prompt.category}
        </Badge>
        <CardTitle>
          <Link
            href={`/prompts/${prompt.id}`}
            className="line-clamp-2 hover:underline"
          >
            {prompt.title}
          </Link>
        </CardTitle>
        {isOwner && (
          <CardAction className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Edit prompt"
              render={<Link href={`/prompts/${prompt.id}/edit`} />}
            >
              <SquarePen />
            </Button>
            <DeletePromptButton id={prompt.id} title={prompt.title} />
          </CardAction>
        )}
      </CardHeader>

      <CardContent className="flex-1">
        <p className="line-clamp-4 text-sm whitespace-pre-wrap text-muted-foreground">
          {prompt.body}
        </p>
      </CardContent>

      <CardFooter className="justify-between gap-2">
        <span className="truncate text-xs text-muted-foreground">
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
        </span>
        <div className="flex shrink-0 items-center gap-1">
          <CopyButton text={prompt.body} />
          <UpvoteButton
            promptId={prompt.id}
            count={prompt.upvotes}
            hasUpvoted={prompt.hasUpvoted}
            isAuthenticated={isAuthenticated}
          />
        </div>
      </CardFooter>
    </Card>
  );
}
