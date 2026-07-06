import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ExternalLink,
  Mail,
  MapPin,
  Pencil,
  Phone,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getPerson } from "@/lib/people/queries";
import { getActiveGoals } from "@/lib/people/goals";
import { matchPersonToGoals } from "@/lib/people/ask";
import { detectLink } from "@/lib/people/links";
import { PersonAvatar } from "@/components/people/person-avatar";
import { DeleteButton } from "@/components/people/delete-button";
import { MetAgainButton } from "@/components/people/met-again-button";

export default async function PersonPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [person, activeGoals] = await Promise.all([
    getPerson(id),
    getActiveGoals(),
  ]);
  if (!person) notFound();

  const goalHits = matchPersonToGoals(person, activeGoals);
  const subtitle = [person.role, person.company].filter(Boolean).join(" · ");

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <Link
        href="/people"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft size={14} />
        Back
      </Link>

      <div className="flex items-start gap-5">
        <PersonAvatar name={person.name} photoUrl={person.photoUrl} size={88} />
        <div className="flex-1 space-y-1">
          <h1 className="font-serif text-4xl font-semibold tracking-tight sm:text-5xl">
            {person.name}
          </h1>
          {subtitle && <p className="text-muted-foreground">{subtitle}</p>}
          {person.location && (
            <p className="flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin size={13} />
              {person.location}
            </p>
          )}
        </div>
        <div className="flex flex-col items-end gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href={`/people/${person.id}/edit`}>
              <Pencil className="mr-1.5" size={14} />
              Edit
            </Link>
          </Button>
          <MetAgainButton id={person.id} timesMet={person.timesMet} />
          <DeleteButton id={person.id} name={person.name} />
        </div>
      </div>

      {(person.email || person.phone) && (
        <Section title="Contact">
          <div className="flex flex-wrap gap-2">
            {person.email && (
              <a
                href={`mailto:${person.email}`}
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm transition-colors hover:border-foreground/20"
              >
                <Mail size={14} className="text-muted-foreground" />
                {person.email}
              </a>
            )}
            {person.phone && (
              <a
                href={`tel:${person.phone.replace(/\s+/g, "")}`}
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm transition-colors hover:border-foreground/20"
              >
                <Phone size={14} className="text-muted-foreground" />
                {person.phone}
              </a>
            )}
          </div>
        </Section>
      )}

      {goalHits.length > 0 && (
        <Section title="May help with your goals">
          <div className="flex flex-wrap gap-1.5">
            {goalHits.map((hit) => (
              <Link
                key={hit.goalId}
                href={`/people/ask?q=${encodeURIComponent(hit.title)}`}
                className="inline-flex items-center gap-1.5 rounded-full border border-berry/30 bg-berry/5 px-3 py-1 text-xs text-foreground transition-colors hover:border-berry/60 hover:bg-berry/10"
              >
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-berry" />
                {hit.title}
              </Link>
            ))}
          </div>
        </Section>
      )}

      {person.needs && (
        <Section title="What I need them for">
          <p className="text-foreground/90">{person.needs}</p>
        </Section>
      )}

      {person.tags.length > 0 && (
        <Section title="Tags">
          <div className="flex flex-wrap gap-1.5">
            {person.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="font-normal">
                {tag}
              </Badge>
            ))}
          </div>
        </Section>
      )}

      {person.links.length > 0 && (
        <Section title="Links">
          <ul className="space-y-2">
            {person.links.map((url) => {
              const link = detectLink(url);
              return (
                <li key={url}>
                  {link.safe ? (
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm hover:underline"
                    >
                      <span className="font-medium">{link.platform}</span>
                      <span className="text-muted-foreground">{link.handle}</span>
                      <ExternalLink size={12} className="text-muted-foreground" />
                    </a>
                  ) : (
                    <span className="text-sm text-muted-foreground">{url}</span>
                  )}
                </li>
              );
            })}
          </ul>
        </Section>
      )}

      {(person.metContext || person.metAt || person.metPlace) && (
        <Section title="How we met">
          <p className="text-sm text-foreground/90">
            {[person.metContext, person.metPlace, person.metAt]
              .filter(Boolean)
              .join(" · ")}
            {person.timesMet > 1 && (
              <span className="text-muted-foreground">
                {" "}
                · met {person.timesMet} times
              </span>
            )}
          </p>
        </Section>
      )}

      {person.notes && (
        <Section title="Notes">
          <p className="whitespace-pre-wrap text-sm text-foreground/90">
            {person.notes}
          </p>
        </Section>
      )}
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-2">
      <h2 className="kicker">
        {title}
      </h2>
      {children}
    </section>
  );
}
