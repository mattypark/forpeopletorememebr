import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import type { Person } from "@/lib/people/types";
import { PersonAvatar } from "./person-avatar";

interface PersonCardProps {
  person: Person;
}

export function PersonCard({ person }: PersonCardProps) {
  const subtitle = [person.role, person.company].filter(Boolean).join(" · ");

  return (
    <Link
      href={`/people/${person.id}`}
      className="group flex flex-col gap-3 rounded-xl border border-border bg-card p-4 transition-[transform,box-shadow,border-color] duration-200 ease-out hover:-translate-y-0.5 hover:border-berry/40 hover:shadow-md active:translate-y-0 active:shadow-sm motion-reduce:transition-none motion-reduce:hover:translate-y-0"
    >
      <div className="flex items-center gap-3">
        <PersonAvatar name={person.name} photoUrl={person.photoUrl} size={48} />
        <div className="min-w-0">
          <h3 className="truncate font-semibold leading-tight">{person.name}</h3>
          {subtitle && (
            <p className="truncate text-sm text-muted-foreground">{subtitle}</p>
          )}
        </div>
      </div>

      {person.needs && (
        <p className="line-clamp-2 text-sm text-foreground/80">
          <span className="font-medium text-foreground/60">Need: </span>
          {person.needs}
        </p>
      )}

      {person.tags.length > 0 && (
        <div className="mt-auto flex flex-wrap gap-1.5 pt-1">
          {person.tags.slice(0, 4).map((tag) => (
            <Badge key={tag} variant="secondary" className="font-normal">
              {tag}
            </Badge>
          ))}
          {person.tags.length > 4 && (
            <Badge variant="outline" className="font-normal">
              +{person.tags.length - 4}
            </Badge>
          )}
        </div>
      )}
    </Link>
  );
}
