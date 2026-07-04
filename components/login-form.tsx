"use client";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function LoginForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      router.push("/people");
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex w-full flex-col gap-8", className)} {...props}>
      <div className="space-y-2">
        <p className="kicker">Sign in</p>
        <h1 className="font-serif text-4xl font-semibold tracking-tight">
          Welcome back.
        </h1>
      </div>

      <form onSubmit={handleLogin} className="flex flex-col gap-6">
        <div className="grid gap-2">
          <Label htmlFor="email" className="kicker">
            Email
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="grid gap-2">
          <div className="flex items-center">
            <Label htmlFor="password" className="kicker">
              Password
            </Label>
            <Link
              href="/auth/forgot-password"
              className="ml-auto inline-block text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              Forgot?
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "Signing in…" : "Sign in"}
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          New here?{" "}
          <Link
            href="/auth/sign-up"
            className="text-foreground underline underline-offset-4 decoration-berry/60 hover:decoration-berry"
          >
            Create an account
          </Link>
        </p>
      </form>
    </div>
  );
}
