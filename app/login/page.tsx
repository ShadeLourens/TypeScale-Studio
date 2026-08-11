"use client";

import { Suspense, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/** Only allow same-origin relative paths as a redirect target — a
 * ?redirect= value could otherwise be crafted to send users off-site. */
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
        <p className="text-lg font-semibold">Check your email</p>
        <p className="text-sm text-gray-600">We sent a sign-in link to {email}.</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6">
      <form onSubmit={handleSubmit} className="flex w-full max-w-xs flex-col gap-3">
        <label className="flex flex-col gap-1 text-sm">
          Email
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded border border-gray-300 px-3 py-1.5"
          />
        </label>
        <button
          type="submit"
          disabled={status === "sending"}
          className="rounded border border-gray-900 px-3 py-1.5 text-sm font-semibold"
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

// useSearchParams() requires a Suspense boundary, same as app/editor/page.tsx.
export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageInner />
    </Suspense>
  );
}
