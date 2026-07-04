import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { PersonForm } from "@/components/people/person-form";

export default function NewPersonPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link
        href="/people"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft size={14} />
        Back
      </Link>
      <h1 className="font-serif text-4xl font-semibold tracking-tight sm:text-5xl">
        Add a person
      </h1>
      <PersonForm />
    </div>
  );
}
