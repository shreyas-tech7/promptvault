import { Navbar } from "@/components/layout/navbar";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Navbar />
      <main className="flex-1">{children}</main>
      <footer className="border-t py-6">
        <div className="mx-auto w-full max-w-5xl px-4 text-center text-xs text-muted-foreground">
          PromptVault · Built with Next.js & Supabase
        </div>
      </footer>
    </>
  );
}
