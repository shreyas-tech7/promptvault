import { createClient } from "@/lib/supabase/server";
import { getCommunityStats, getPrompts } from "@/lib/data";
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

  const [prompts, stats] = await Promise.all([
    getPrompts(user?.id),
    getCommunityStats(),
  ]);

  const heroStats = [
    { value: stats.prompts, label: stats.prompts === 1 ? "prompt" : "prompts" },
    { value: stats.members, label: stats.members === 1 ? "member" : "members" },
    { value: stats.upvotes, label: stats.upvotes === 1 ? "upvote" : "upvotes" },
  ];

  return (
    <>
      <section className="border-b border-border bg-gradient-to-b from-muted/50 via-muted/20 to-background">
        <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:py-24">
          <div className="flex flex-col gap-3">
            <h1 className="font-heading text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
              The community prompt library
            </h1>
            <p className="max-w-3xl text-lg text-muted-foreground">
              Discover, save and upvote the best AI prompts for coding, writing,
              image generation and more.
            </p>
            <dl className="mt-4 flex flex-wrap gap-x-8 gap-y-3">
              {heroStats.map((stat) => (
                <div key={stat.label} className="flex items-baseline gap-2">
                  <dd className="font-heading text-2xl font-semibold tabular-nums">
                    {stat.value.toLocaleString("en-US")}
                  </dd>
                  <dt className="text-sm text-muted-foreground">
                    {stat.label}
                  </dt>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:py-16">
        <Feed
          prompts={prompts}
          isAuthenticated={!!user}
          currentUserId={user?.id ?? null}
        />

        <ToastOnLoad value={toastValue} />
      </div>
    </>
  );
}
