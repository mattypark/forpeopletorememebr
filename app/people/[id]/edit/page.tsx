import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { getPerson } from "@/lib/people/queries";
import { PersonForm } from "@/components/people/person-form";

export default async function EditPersonPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const person = await getPerson(id);
  if (!person) notFound();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link
        href={`/people/${person.id}`}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft size={14} />
        Back
      </Link>
      <h1 className="font-serif text-4xl font-semibold tracking-tight sm:text-5xl">
        Edit {person.name}
      </h1>
      <PersonForm person={person} />
    </div>
  );
}
