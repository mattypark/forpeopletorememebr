"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";
import { BeryWordmark } from "@/components/bery-logo";

/**
 * Landing page for the email confirmation link. Supabase redirects here after
 * verifying the address, with the session either as a PKCE `?code=` param or
 * as `#access_token` hash tokens. Both are turned into a cookie session, then
 * the user is dropped into onboarding. Lives under /auth so the proxy allows
 * it without an existing session.
 */
export default function ConfirmedPage() {
  const router = useRouter();
  const [status, setStatus] = useState<"working" | "failed">("working");

  useEffect(() => {
    const supabase = createClient();
    let settled = false;

    const go = () => {
      if (settled) return;
      settled = true;
      router.replace("/onboarding");
    };

    // Hash-token flow: supabase-js ingests the hash automatically and fires
    // SIGNED_IN. Subscribe before kicking off the checks to avoid the race.
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) go();
    });

    (async () => {
      const code = new URL(window.location.href).searchParams.get("code");
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (!error) return go();
      }
      const { data } = await supabase.auth.getSession();
      if (data.session) go();
    })();

    const timer = setTimeout(() => {
      if (!settled) {
        settled = true;
        setStatus("failed");
      }
    }, 8000);

    return () => {
      clearTimeout(timer);
      sub.subscription.unsubscribe();
    };
  }, [router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center">
      <BeryWordmark markSize={28} />
      {status === "working" ? (
        <>
          <h1 className="font-serif text-3xl font-semibold tracking-tight">
            Email confirmed
          </h1>
          <p className="text-sm text-muted-foreground">
            Signing you in&hellip;
          </p>
        </>
      ) : (
        <>
          <h1 className="font-serif text-3xl font-semibold tracking-tight">
            You&apos;re confirmed
          </h1>
          <p className="max-w-sm text-sm text-muted-foreground">
            Your email is verified. Sign in with your new account to get
            started.
          </p>
          <button
            type="button"
            onClick={() => router.replace("/auth/login")}
            className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            Sign in
          </button>
        </>
      )}
    </div>
  );
}
