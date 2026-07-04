import { BeryMark, BeryWordmark } from "@/components/bery-logo";

/**
 * Auth shell — editorial split. Left: the brand statement on cream with an
 * oversized berry watermark. Right: whatever form the route renders.
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-svh lg:grid-cols-[1.1fr_1fr]">
      <aside className="relative hidden overflow-hidden border-r border-border bg-card/60 p-10 lg:flex lg:flex-col lg:justify-between">
        <BeryMark
          size={520}
          className="absolute -bottom-32 -right-28 rotate-12 opacity-[0.06]"
        />

        <BeryWordmark markSize={22} />

        <div className="relative max-w-md space-y-6">
          <h1 className="font-serif text-5xl font-semibold leading-[1.05] tracking-tight xl:text-6xl">
            Everyone you meet,{" "}
            <em className="text-berry">remembered</em>.
          </h1>
          <p className="text-muted-foreground">
            Bery is your private network memory — searchable by what you need,
            not just who you know.
          </p>
        </div>

        <ul className="relative space-y-2.5 text-sm text-muted-foreground">
          {[
            "Ask “who can intro me to a climate VC?” — get answers from your own people.",
            "AI research from public profiles only. No OAuth, no inbox access.",
            "Goals turn your network into a to-do list that works for you.",
          ].map((line) => (
            <li key={line} className="flex items-start gap-2.5">
              <span className="mt-1.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-berry" />
              {line}
            </li>
          ))}
        </ul>
      </aside>

      <div className="flex flex-col">
        <div className="flex items-center p-6 lg:hidden">
          <BeryWordmark markSize={20} />
        </div>
        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
}
