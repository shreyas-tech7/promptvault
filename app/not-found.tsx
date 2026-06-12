import { connection } from "next/server";
import Link from "next/link";
import { Button } from "@/components/ui/button";

/**
 * Custom 404. `connection()` opts this page into dynamic rendering so it
 * receives the per-request CSP nonce from the proxy (a statically generated
 * page would ship scripts without a nonce and fail to hydrate under our CSP).
 */
export default async function NotFound() {
  await connection();

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-4 px-4 py-16 text-center">
      <p className="font-heading text-5xl font-semibold tracking-tight">404</p>
      <h1 className="font-heading text-xl font-semibold tracking-tight">
        Page not found
      </h1>
      <p className="text-sm text-muted-foreground">
        The page you&apos;re looking for doesn&apos;t exist or may have been
        moved.
      </p>
      <Button render={<Link href="/" />}>Back to prompts</Button>
    </main>
  );
}
