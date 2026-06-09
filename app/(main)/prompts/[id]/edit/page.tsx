import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { updatePrompt } from "@/app/prompts/actions";
import { PromptForm } from "@/components/prompts/prompt-form";
import type { Prompt } from "@/lib/types";

export default async function EditPromptPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?redirectTo=/prompts/${id}/edit`);
  }

  const { data } = await supabase
    .from("prompts")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  const prompt = data as Prompt | null;
  if (!prompt) notFound();

  // Only the owner can edit. RLS also enforces this on write.
  if (prompt.user_id !== user.id) {
    redirect(`/prompts/${id}`);
  }

  const action = updatePrompt.bind(null, id);

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8">
      <header className="mb-6 flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          Edit prompt
        </h1>
        <p className="text-sm text-muted-foreground">
          Update your prompt&apos;s title, category or content.
        </p>
      </header>

      <PromptForm
        action={action}
        submitLabel="Save changes"
        defaultValues={{
          title: prompt.title,
          body: prompt.body,
          category: prompt.category,
        }}
      />
    </div>
  );
}
