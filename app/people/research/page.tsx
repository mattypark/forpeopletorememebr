import { ResearchChat } from "@/components/research/research-chat";
import { PageHeader } from "@/components/page-header";

export default function ResearchPage() {
  return (
    <div className="space-y-6">
      <PageHeader kicker="Add someone new" title="Research">
        <p className="text-sm text-muted-foreground">
          Talk to the AI. It searches the web for a person&apos;s public
          profiles and builds a card — you add the private details and save.
        </p>
        <p className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-berry" />
          No OAuth, no inbox access — only public LinkedIn, GitHub, and
          Instagram, plus links you paste.
        </p>
      </PageHeader>
      <ResearchChat />
    </div>
  );
}
