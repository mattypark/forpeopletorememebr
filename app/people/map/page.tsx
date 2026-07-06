import { getPeople } from "@/lib/people/queries";
import { PeopleMap, type MapPin } from "@/components/people/people-map";

export default async function MapPage() {
  const people = await getPeople();

  const pins: MapPin[] = people
    .filter((p) => p.metLat !== null && p.metLng !== null)
    .map((p) => ({
      id: p.id,
      name: p.name,
      subtitle: [p.role, p.company].filter(Boolean).join(" · "),
      photoUrl: p.photoUrl,
      metPlace: p.metPlace ?? "",
      timesMet: p.timesMet,
      lat: p.metLat as number,
      lng: p.metLng as number,
    }));

  const missing = people.length - pins.length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-4xl font-semibold tracking-tight sm:text-5xl">
          Map
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Where you met everyone. Hover a dot to see who it is.
        </p>
      </div>

      <PeopleMap pins={pins} />

      {missing > 0 && (
        <p className="text-xs text-muted-foreground">
          {pins.length === 0
            ? "No dots yet — "
            : `${missing} ${missing === 1 ? "person is" : "people are"} not on the map — `}
          add &ldquo;Where we met&rdquo; (not their home location) on a
          person&apos;s profile and a dot appears here.
        </p>
      )}
    </div>
  );
}
