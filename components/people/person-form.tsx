"use client";

import { useState, useTransition } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  personFormSchema,
  toFormValues,
  type Person,
  type PersonFormValues,
} from "@/lib/people/types";
import {
  createPerson,
  updatePerson,
  intakePersonAction,
} from "@/lib/people/actions";
import { TagsField } from "./tags-field";
import { LinksField } from "./links-field";
import { PhotoField } from "./photo-field";
import { PlaceField } from "./place-field";

interface PersonFormProps {
  person?: Person | null;
  /** Pre-fill from the agent's researched draft (e.g. /people/new?draft=…). */
  initial?: Partial<PersonFormValues> | null;
}

export function PersonForm({ person, initial }: PersonFormProps) {
  const isEdit = Boolean(person);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    watch,
    getValues,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<PersonFormValues>({
    resolver: zodResolver(personFormSchema),
    defaultValues: { ...toFormValues(person), ...(initial ?? {}) },
  });

  const name = watch("name");

  const [description, setDescription] = useState("");
  const [enriching, startEnrich] = useTransition();
  const [enrichNote, setEnrichNote] = useState<string | null>(null);

  const handleEnrich = () => {
    setEnrichNote(null);
    startEnrich(async () => {
      const v = getValues();
      // Research from the description; fall back to whatever is in the form.
      const query =
        description.trim() ||
        [v.name, v.role, v.company].filter(Boolean).join(", ");
      const res = await intakePersonAction(query);
      if (res.error || !res.result) {
        setEnrichNote(res.error ?? "Nothing found.");
        return;
      }

      const { draft, needs, metContext, usedScraper, sources } = res.result;
      const filled: string[] = [];
      const set = (key: keyof PersonFormValues, value: string, label: string) => {
        if (value && !v[key]) {
          setValue(key, value, { shouldDirty: true, shouldValidate: true });
          filled.push(label);
        }
      };
      set("name", draft.name, "name");
      set("role", draft.role, "role");
      set("company", draft.company, "company");
      set("location", draft.location, "location");
      set("email", draft.email, "email");
      set("notes", draft.summary, "notes");
      set("needs", needs, "what you need them for");
      set("metContext", metContext, "how you met");

      const newLinks = draft.links.filter((l) => !v.links.includes(l));
      if (newLinks.length) {
        setValue("links", [...v.links, ...newLinks], { shouldDirty: true });
        filled.push(`${newLinks.length} link${newLinks.length > 1 ? "s" : ""}`);
      }
      const newTags = draft.tags.filter((t) => !v.tags.includes(t));
      if (newTags.length) {
        setValue("tags", [...v.tags, ...newTags], { shouldDirty: true });
        filled.push(`${newTags.length} tag${newTags.length > 1 ? "s" : ""}`);
      }

      const parts = [
        filled.length ? `Filled ${filled.join(", ")}.` : "Nothing new to add.",
        usedScraper
          ? "Scraped their public profiles with Scrapling."
          : sources.length
            ? "Found via web search."
            : "",
        newLinks.length ? "Verify the linked profiles are the right person." : "",
      ].filter(Boolean);
      setEnrichNote(parts.join(" "));
    });
  };

  const onSubmit = async (values: PersonFormValues) => {
    setServerError(null);
    const result = isEdit
      ? await updatePerson(person!.id, values)
      : await createPerson(values);
    // A successful action redirects and never returns; reaching here means error.
    if (result?.error) setServerError(result.error);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      <Controller
        control={control}
        name="photoPath"
        render={({ field }) => (
          <PhotoField
            name={name}
            photoPath={field.value}
            previewUrl={person?.photoUrl ?? null}
            onChange={field.onChange}
          />
        )}
      />

      <div className="space-y-2 rounded-lg border border-dashed border-border bg-muted/30 p-3">
        <p className="text-sm text-muted-foreground">
          Tell the agent who they are — it researches LinkedIn, Instagram and
          GitHub, then fills the form.
        </p>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="e.g. Yurii Tovarnytskyi, met him through LinkedIn, cracked SWE, YC founder in NYC…"
          className="min-h-[60px] bg-background"
          disabled={enriching}
        />
        <div className="flex items-center justify-between gap-3">
          {enrichNote ? (
            <p className="text-xs text-muted-foreground">{enrichNote}</p>
          ) : (
            <span />
          )}
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={enriching || (!description.trim() && !name?.trim())}
            onClick={handleEnrich}
          >
            {enriching ? (
              <Loader2 className="mr-1.5 animate-spin" size={14} />
            ) : (
              <Sparkles className="mr-1.5" size={14} />
            )}
            {enriching ? "Researching…" : "Research & fill"}
          </Button>
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Name" error={errors.name?.message} required>
          <Input {...register("name")} placeholder="Jane Rivera" />
        </Field>
        <Field label="Role / title" error={errors.role?.message}>
          <Input {...register("role")} placeholder="Founder, ML engineer…" />
        </Field>
        <Field label="Company" error={errors.company?.message}>
          <Input {...register("company")} placeholder="Acme" />
        </Field>
        <Field label="Location" error={errors.location?.message}>
          <Input {...register("location")} placeholder="San Francisco" />
        </Field>
        <Field label="Email" error={errors.email?.message}>
          <Input
            type="email"
            inputMode="email"
            {...register("email")}
            placeholder="jane@acme.com"
          />
        </Field>
        <Field label="Phone" error={errors.phone?.message}>
          <Input
            type="tel"
            inputMode="tel"
            {...register("phone")}
            placeholder="+1 555 123 4567"
          />
        </Field>
      </div>

      <Field
        label="What I need them for"
        error={errors.needs?.message}
        hint="The reason this person matters to you right now."
      >
        <Textarea
          {...register("needs")}
          placeholder="Intro to their design team; advice on fundraising…"
        />
      </Field>

      <Field label="Tags" error={errors.tags?.message}>
        <Controller
          control={control}
          name="tags"
          render={({ field }) => (
            <TagsField value={field.value} onChange={field.onChange} />
          )}
        />
      </Field>

      <Field label="Links" hint="Social, GitHub, portfolio — paste any URL.">
        <Controller
          control={control}
          name="links"
          render={({ field }) => (
            <LinksField value={field.value} onChange={field.onChange} />
          )}
        />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="How we met" error={errors.metContext?.message}>
          <Input
            {...register("metContext")}
            placeholder="YC dinner, mutual friend…"
          />
        </Field>
        <Field label="Date met" error={errors.metAt?.message}>
          <Input type="date" {...register("metAt")} />
        </Field>
        <Field
          label="Where we met"
          error={errors.metPlace?.message}
          hint="Start typing a place — pick a suggestion to pin them on your map."
        >
          <Controller
            control={control}
            name="metPlace"
            render={({ field }) => (
              <PlaceField
                value={field.value}
                onChange={(place, lat, lng) => {
                  field.onChange(place);
                  setValue("metLat", lat, { shouldDirty: true });
                  setValue("metLng", lng, { shouldDirty: true });
                }}
                placeholder="Washington Square Park, NYC"
              />
            )}
          />
        </Field>
        <Field label="Times met" error={errors.timesMet?.message}>
          <Input
            type="number"
            min={1}
            max={10000}
            {...register("timesMet", { valueAsNumber: true })}
          />
        </Field>
      </div>

      <Field label="Notes" error={errors.notes?.message}>
        <Textarea
          {...register("notes")}
          className="min-h-[120px]"
          placeholder="Anything worth remembering…"
        />
      </Field>

      {serverError && (
        <p className="text-sm text-destructive" role="alert">
          {serverError}
        </p>
      )}

      <div className="flex gap-3">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-1.5 animate-spin" size={16} />}
          {isEdit ? "Save changes" : "Add person"}
        </Button>
      </div>
    </form>
  );
}

interface FieldProps {
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}

function Field({ label, error, hint, required, children }: FieldProps) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium">
        {label}
        {required && <span className="ml-0.5 text-destructive">*</span>}
      </Label>
      {children}
      {hint && !error && <p className="text-xs text-muted-foreground">{hint}</p>}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
