"use client";

import { useTransition } from "react";
import { LoaderCircle, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deletePrompt } from "@/app/prompts/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function DeletePromptButton({
  id,
  title,
  variant = "icon",
  onClick,
}: {
  id: string;
  title: string;
  variant?: "icon" | "full";
  onClick?: (e: React.MouseEvent) => void;
}) {
  const [pending, startTransition] = useTransition();

  function handleDelete() {
    startTransition(async () => {
      const result = await deletePrompt(id);
      // On success `deletePrompt` redirects, so we only get here on error.
      if (result?.error) toast.error(result.error);
    });
  }

  function handleTriggerClick(e: React.MouseEvent) {
    onClick?.(e);
  }

  return (
    <Dialog>
      <DialogTrigger
        onClick={handleTriggerClick}
        render={
          variant === "icon" ? (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="Delete prompt"
            />
          ) : (
            <Button type="button" variant="destructive" />
          )
        }
      >
        <Trash2 />
        {variant === "full" && "Delete"}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete this prompt?</DialogTitle>
          <DialogDescription>
            &ldquo;{title}&rdquo; will be permanently removed. This can&apos;t be
            undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose render={<Button type="button" variant="outline" />}>
            Cancel
          </DialogClose>
          <Button
            type="button"
            variant="destructive"
            disabled={pending}
            onClick={handleDelete}
          >
            {pending && <LoaderCircle className="animate-spin" />}
            Delete prompt
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
