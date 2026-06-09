"use client";

import Link from "next/link";
import { useActionState, useEffect } from "react";
import { LoaderCircle, MailCheck } from "lucide-react";
import { toast } from "sonner";
import { signup, type AuthState } from "@/app/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function SignupForm({ redirectTo = "/" }: { redirectTo?: string }) {
  const [state, formAction, pending] = useActionState<AuthState | undefined, FormData>(
    signup,
    undefined,
  );

  useEffect(() => {
    if (state?.error) toast.error(state.error);
  }, [state]);

  if (state?.message) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border bg-muted/40 p-6 text-center">
        <span className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
          <MailCheck className="size-5" />
        </span>
        <p className="text-sm text-muted-foreground">{state.message}</p>
        <Button render={<Link href="/login" />} className="w-full">
          Go to login
        </Button>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="redirectTo" value={redirectTo} />

      <div className="flex flex-col gap-2">
        <Label htmlFor="username">Username</Label>
        <Input
          id="username"
          name="username"
          type="text"
          autoComplete="username"
          placeholder="promptsmith"
          required
        />
      </div>

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
          autoComplete="new-password"
          placeholder="At least 6 characters"
          required
          minLength={6}
        />
      </div>

      <Button type="submit" className="w-full" size="lg" disabled={pending}>
        {pending && <LoaderCircle className="animate-spin" />}
        Create account
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-foreground hover:underline">
          Log in
        </Link>
      </p>
    </form>
  );
}
