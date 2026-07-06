import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { needsOnboarding } from "@/lib/onboarding";
import { OnboardingFlow } from "@/components/onboarding/onboarding-flow";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) redirect("/auth/login");

  if (!needsOnboarding(data.user.user_metadata)) redirect("/people");

  const email = data.user.email ?? "";
  const firstName = email ? email.split("@")[0].split(/[._-]/)[0] : null;

  return (
    <OnboardingFlow
      firstName={firstName ? firstName[0].toUpperCase() + firstName.slice(1) : null}
    />
  );
}
