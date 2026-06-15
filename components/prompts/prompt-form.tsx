"use client";

import { useActionState, useEffect, useState } from "react";
import { LoaderCircle } from "lucide-react";
import { toast } from "sonner";
import type { PromptFormState } from "@/app/prompts/actions";
import { CATEGORIES } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { EnhanceDialog } from "@/components/prompts/enhance-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type PromptAction = (
  state: PromptFormState | undefined,
  formData: FormData,
) => Promise<PromptFormState>;

interface PromptFormProps {
  action: PromptAction;
  submitLabel: string;
  defaultValues?: {
    title?: string;
    body?: string;
    category?: string;
  };
}

export function PromptForm({
  action,
  submitLabel,
  defaultValues,
}: PromptFormProps) {
  const [state, formAction, pending] = useActionState<
    PromptFormState | undefined,
    FormData
  >(action, undefined);

  const [category, setCategory] = useState<string | null>(
    defaultValues?.category ?? null,
  );

  // `body` is controlled so the AI enhancer can insert suggestions into it.
  const [body, setBody] = useState(defaultValues?.body ?? "");

  useEffect(() => {
    if (state?.error) toast.error(state.error);
  }, [state]);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          name="title"
          placeholder="e.g. Senior code reviewer"
          defaultValue={defaultValues?.title}
          maxLength={120}
          required
        />
        {state?.fieldErrors?.title && (
          <p className="text-sm text-destructive">{state.fieldErrors.title}</p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="category-trigger">Category</Label>
        <Select value={category} onValueChange={(value) => setCategory(value)}>
          <SelectTrigger id="category-trigger" className="w-full">
            <SelectValue placeholder="Choose a category" />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <input type="hidden" name="category" value={category ?? ""} />
        {state?.fieldErrors?.category && (
          <p className="text-sm text-destructive">
            {state.fieldErrors.category}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <Label htmlFor="body">Prompt</Label>
          <EnhanceDialog draft={body} onApply={setBody} />
        </div>
        <Textarea
          id="body"
          name="body"
          placeholder="Write the full prompt here…"
          value={body}
          onChange={(event) => setBody(event.target.value)}
          className="min-h-48"
          maxLength={5000}
          required
        />
        {state?.fieldErrors?.body && (
          <p className="text-sm text-destructive">{state.fieldErrors.body}</p>
        )}
      </div>

      <div className="flex justify-end">
        <Button type="submit" size="lg" disabled={pending}>
          {pending && <LoaderCircle className="animate-spin" />}
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
