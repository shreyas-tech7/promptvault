"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef } from "react";
import { LoaderCircle } from "lucide-react";
import { toast } from "sonner";
import { login, type AuthState } from "@/app/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm({
  redirectTo = "/",
  initialError,
}: {
  redirectTo?: string;
  initialError?: string;
}) {
  const [state, formAction, pending] = useActionState<AuthState | undefined, FormData>(
    login,
    undefined,
  );

  const shownInitialError = useRef(false);
  useEffect(() => {
    if (initialError && !shownInitialError.current) {
      shownInitialError.current = true;
      toast.error(initialError);
    }
  }, [initialError]);

  useEffect(() => {
    if (state?.error) toast.error(state.error);
  }, [state]);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="redirectTo" value={redirectTo} />

      <div className="flex flex-col gap-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          required
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          required
        />
      </div>

      <Button type="submit" className="w-full" size="lg" disabled={pending}>
        {pending && <LoaderCircle className="animate-spin" />}
        Log in
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="font-medium text-foreground hover:underline">
          Sign up
        </Link>
      </p>
    </form>
  );
}
