"use client";

import { Suspense, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/** Makes sure someone can only be redirected back within this site after
 * logging in, never sent off to some other website. */
function resolveSafeRedirect(redirect: string | null): string {
  if (redirect && redirect.startsWith("/") && !redirect.startsWith("//")) {
    return redirect;
  }
  return "/editor";
}

function LoginPageInner() {
  const searchParams = useSearchParams();
  const safeRedirect = resolveSafeRedirect(searchParams.get("redirect"));
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("sending");

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}${safeRedirect}` },
    });

    setStatus(error ? "error" : "sent");
  }

  if (status === "sent") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-2 p-6 text-center">
        <div className="surface flex flex-col items-center gap-2 p-8">
          <p className="text-lg font-semibold">Check your email</p>
          <p className="text-sm text-muted-foreground">
            We sent a sign-in link to {email}.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6">
      <form
        onSubmit={handleSubmit}
        className="surface flex w-full max-w-xs flex-col gap-3 p-4"
      >
        <label className="flex flex-col gap-1 text-sm">
          Email
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-sm border border-border bg-surface/60 px-3 py-1.5 transition-colors focus-visible:border-accent"
          />
        </label>
        <button
          type="submit"
          disabled={status === "sending"}
          className="rounded-sm border border-accent px-3 py-1.5 text-sm font-semibold transition-colors hover:bg-accent/10"
        >
          {status === "sending" ? "Sending…" : "Send sign-in link"}
        </button>
        {status === "error" && (
          <p className="text-sm text-red-600">Something went wrong sending the link — try again.</p>
        )}
        {searchParams.get("error") === "invalid-link" && (
          <p className="text-sm text-red-600">That sign-in link was invalid or expired — request a new one.</p>
        )}
      </form>
    </div>
  );
}

// Next.js requires this kind of page to be wrapped like this when it reads
// the link's search text.
export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageInner />
    </Suspense>
  );
}
