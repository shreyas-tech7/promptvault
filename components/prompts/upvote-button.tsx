"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowBigUp, LoaderCircle } from "lucide-react";
import { toast } from "sonner";
import { toggleUpvote } from "@/app/prompts/actions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function UpvoteButton({
  promptId,
  count,
  hasUpvoted,
  isAuthenticated,
}: {
  promptId: string;
  count: number;
  hasUpvoted: boolean;
  isAuthenticated: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleClick() {
    if (!isAuthenticated) {
      toast.error("Log in to upvote prompts.");
      router.push(`/login?redirectTo=/`);
      return;
    }

    startTransition(async () => {
      const result = await toggleUpvote(promptId);
      if (result?.error) toast.error(result.error);
    });
  }

  return (
    <Button
      type="button"
      variant={hasUpvoted ? "default" : "outline"}
      size="sm"
      onClick={handleClick}
      disabled={pending}
      aria-pressed={hasUpvoted}
      aria-label={hasUpvoted ? "Remove upvote" : "Upvote prompt"}
    >
      {pending ? (
        <LoaderCircle className="animate-spin" />
      ) : (
        <ArrowBigUp className={cn(hasUpvoted && "fill-current")} />
      )}
      <span className="tabular-nums">{count}</span>
    </Button>
  );
}
