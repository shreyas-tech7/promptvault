import { createClient } from "@/lib/supabase/server";
import { getPrompts } from "@/lib/data";
import { Feed } from "@/components/prompts/feed";
import { ToastOnLoad } from "@/components/toast-on-load";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const sp = await searchParams;
  const toastValue = typeof sp.toast === "string" ? sp.toast : null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const prompts = await getPrompts(user?.id);

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8">
      <section className="mb-8 flex flex-col gap-2">
        <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
          The community prompt library
        </h1>
        <p className="max-w-2xl text-muted-foreground">
          Discover, save and upvote the best AI prompts for coding, writing,
          image generation and more.
        </p>
      </section>

      <Feed
        prompts={prompts}
        isAuthenticated={!!user}
        currentUserId={user?.id ?? null}
      />

      <ToastOnLoad value={toastValue} />
    </div>
  );
}
