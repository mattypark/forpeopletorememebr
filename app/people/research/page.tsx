import { ResearchChat } from "@/components/research/research-chat";

export default function ResearchPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-semibold tracking-tight">
          Research
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Talk to the AI. It searches the web for a person&apos;s public
          profiles and builds a card — you add the private details and save.
        </p>
      </div>
      <ResearchChat />
    </div>
  );
}
