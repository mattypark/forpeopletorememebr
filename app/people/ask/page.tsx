import { AskNetwork } from "@/components/ask/ask-network";
import { PageHeader } from "@/components/page-header";

export const metadata = { title: "Ask — Bery" };

interface AskPageProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function AskPage({ searchParams }: AskPageProps) {
  const { q } = await searchParams;

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <PageHeader kicker="Intent search" title="Ask your network">
        <p className="text-sm text-muted-foreground">
          Search people by what you need, not what you remember. Bery ranks
          your own contacts against the goal and suggests an opener.
        </p>
      </PageHeader>
      <AskNetwork initialQuery={q ?? ""} />
    </div>
  );
}
