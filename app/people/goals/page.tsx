import { getGoals } from "@/lib/people/goals";
import { GoalsPanel } from "@/components/goals/goals-panel";
import { PageHeader } from "@/components/page-header";

export const metadata = { title: "Goals — Bery" };

export default async function GoalsPage() {
  const { goals, tableMissing } = await getGoals();

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <PageHeader kicker="What you're working on" title="Goals">
        <p className="text-sm text-muted-foreground">
          Tell Bery what you&apos;re working on. Your network gets matched
          against every open goal — new people included.
        </p>
      </PageHeader>
      <GoalsPanel goals={goals} tableMissing={tableMissing} />
    </div>
  );
}
