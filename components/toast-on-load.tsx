"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";

const MESSAGES: Record<string, string> = {
  created: "Prompt published 🎉",
  updated: "Prompt updated",
  deleted: "Prompt deleted",
  confirmed: "Email confirmed — you're logged in 🎉",
};

/**
 * Fires a one-off success toast based on a `?toast=` query param, then strips
 * the param from the URL so it doesn't fire again on refresh.
 */
export function ToastOnLoad({ value }: { value: string | null }) {
  const router = useRouter();
  const pathname = usePathname();
  const fired = useRef(false);

  useEffect(() => {
    if (!value || fired.current) return;
    fired.current = true;

    const message = MESSAGES[value];
    if (message) toast.success(message);

    router.replace(pathname);
  }, [value, pathname, router]);

  return null;
}
