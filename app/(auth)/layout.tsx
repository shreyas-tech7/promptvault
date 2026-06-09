import Link from "next/link";
import { Sparkles } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="flex flex-1 flex-col items-center justify-center p-4">
      <Link
        href="/"
        className="mb-6 flex items-center gap-2 font-heading text-xl font-semibold tracking-tight"
      >
        <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Sparkles className="size-4" />
        </span>
        PromptVault
      </Link>
      <div className="w-full max-w-sm">{children}</div>
    </main>
  );
}
