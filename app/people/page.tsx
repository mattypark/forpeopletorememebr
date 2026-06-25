import Link from "next/link";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getPeople } from "@/lib/people/queries";
import { PeopleBrowser } from "@/components/people/people-browser";

export default async function PeoplePage() {
  const people = await getPeople();

  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-semibold tracking-tight">
            People
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Everyone you&apos;ve met — and why they matter.
          </p>
        </div>
        <Button asChild>
          <Link href="/people/new">
            <Plus className="mr-1.5" size={16} />
            Add person
          </Link>
        </Button>
      </div>

      {people.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border py-16 text-center">
          <p className="text-sm text-muted-foreground">
            No people yet. Add the first person you want to remember.
          </p>
          <Button asChild className="mt-4">
            <Link href="/people/new">
              <Plus className="mr-1.5" size={16} />
              Add person
            </Link>
          </Button>
        </div>
      ) : (
        <PeopleBrowser people={people} />
      )}
    </div>
  );
}
