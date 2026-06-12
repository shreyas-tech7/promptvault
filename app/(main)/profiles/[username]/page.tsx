import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProfileByUsername, getPromptsByUserId } from "@/lib/data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PromptCard } from "@/components/prompts/prompt-card";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;
  return {
    title: `${username}'s Profile — PromptVault`,
    description: `Browse AI prompts shared by ${username} on PromptVault.`,
  };
}

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;

  const profile = await getProfileByUsername(username);
  if (!profile) {
    notFound();
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const prompts = await getPromptsByUserId(profile.id, user?.id);

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8">
      <Link
        href="/"
        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        ← Back to prompts
      </Link>

      <div className="mt-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">{profile.username}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                Joined
              </label>
              <p className="text-lg">{formatDate(profile.created_at)}</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                Prompts
              </label>
              <p className="text-lg font-semibold">{prompts.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {prompts.length > 0 ? (
        <div className="space-y-4">
          <h2 className="font-heading text-xl font-semibold tracking-tight">
            {profile.username}&apos;s Prompts
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {prompts.map((prompt) => (
              <PromptCard
                key={prompt.id}
                prompt={prompt}
                isAuthenticated={!!user}
                isOwner={!!user && prompt.user_id === user.id}
              />
            ))}
          </div>
        </div>
      ) : (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <p>{profile.username} hasn&apos;t created any prompts yet.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
