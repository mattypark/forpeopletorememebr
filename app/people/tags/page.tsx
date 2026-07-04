import { getPeople } from "@/lib/people/queries";
import { PeopleBrowser } from "@/components/people/people-browser";

export default async function TagsPage() {
  const people = await getPeople();

  const counts = new Map<string, number>();
  for (const person of people) {
    for (const tag of person.tags) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }
  const tagCount = counts.size;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-4xl font-semibold tracking-tight sm:text-5xl">
          Tags
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {tagCount} {tagCount === 1 ? "tag" : "tags"} across your network. Tap a
          chip to filter.
        </p>
      </div>

      {people.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border py-16 text-center text-sm text-muted-foreground">
          No tags yet — add people and tag them to organize your network.
        </div>
      ) : (
        <PeopleBrowser people={people} />
      )}
    </div>
  );
}
