interface PageHeaderProps {
  kicker: string;
  title: string;
  children?: React.ReactNode;
}

/**
 * Editorial page header — small-caps kicker, oversized serif headline,
 * hairline rule. Every dashboard page opens with this rhythm.
 */
export function PageHeader({ kicker, title, children }: PageHeaderProps) {
  return (
    <header className="space-y-3 border-b border-border pb-6">
      <p className="kicker">{kicker}</p>
      <h1 className="font-serif text-4xl font-semibold tracking-tight sm:text-5xl">
        {title}
      </h1>
      {children}
    </header>
  );
}
