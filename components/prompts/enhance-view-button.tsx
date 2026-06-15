"use client";

import { toast } from "sonner";
import { EnhanceDialog } from "@/components/prompts/enhance-dialog";

export function EnhanceViewButton({ promptBody }: { promptBody: string }) {
  async function handleApply(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Enhanced prompt copied to clipboard.");
    } catch {
      toast.error("Couldn't copy — try selecting the text manually.");
    }
  }

  return (
    <EnhanceDialog
      draft={promptBody}
      onApply={handleApply}
      applyLabel="Copy enhanced prompt"
    />
  );
}
