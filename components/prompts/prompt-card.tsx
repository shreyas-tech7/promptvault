"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
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
  const router = useRouter();

  const handleAuthorClick = (e: React.MouseEvent, author: string) => {
    e.preventDefault();
    e.stopPropagation();
    router.push(`/profiles/${author}`);
  };

  const handleCardClick = () => {
    router.push(`/prompts/${prompt.id}`);
  };

  return (
    <Card
      className="h-full transition-all duration-200 hover:shadow-lg hover:-translate-y-1 cursor-pointer group/card"
      onClick={handleCardClick}
    >
      <CardHeader>
        <Badge variant="secondary" className="mb-1 w-fit">
          {prompt.category}
        </Badge>
        <CardTitle>
          <div className="line-clamp-2 group-hover/card:text-primary transition-colors">
            {prompt.title}
          </div>
        </CardTitle>
        {isOwner && (
          <CardAction className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Edit prompt"
              render={<Link href={`/prompts/${prompt.id}/edit`} />}
              onClick={(e) => e.stopPropagation()}
            >
              <SquarePen />
            </Button>
            <DeletePromptButton
              id={prompt.id}
              title={prompt.title}
              onClick={(e) => e.stopPropagation()}
            />
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
            <button
              onClick={(e) => handleAuthorClick(e, prompt.author!)}
              className="font-medium hover:underline cursor-pointer bg-transparent border-none p-0"
            >
              {prompt.author}
            </button>
          ) : (
            "anonymous"
          )}{" "}
          · {formatDate(prompt.created_at)}
        </span>
        <div className="flex shrink-0 items-center gap-1">
          <CopyButton
            text={prompt.body}
            onClick={(e) => e.stopPropagation()}
          />
          <UpvoteButton
            promptId={prompt.id}
            count={prompt.upvotes}
            hasUpvoted={prompt.hasUpvoted}
            isAuthenticated={isAuthenticated}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      </CardFooter>
    </Card>
  );
}
