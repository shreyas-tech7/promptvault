import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createPrompt } from "@/app/prompts/actions";
import { PromptForm } from "@/components/prompts/prompt-form";

export default async function NewPromptPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirectTo=/prompts/new");
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8">
      <header className="mb-6 flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          Create a prompt
        </h1>
        <p className="text-sm text-muted-foreground">
          Share a prompt with the community. Make the title descriptive so
          others can find it.
        </p>
      </header>

      <PromptForm action={createPrompt} submitLabel="Publish prompt" />
    </div>
  );
}
