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
  enrichPersonAction,
} from "@/lib/people/actions";
import { TagsField } from "./tags-field";
import { LinksField } from "./links-field";
import { PhotoField } from "./photo-field";

interface PersonFormProps {
  person?: Person | null;
}

export function PersonForm({ person }: PersonFormProps) {
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
    defaultValues: toFormValues(person),
  });

  const name = watch("name");

  const [enriching, startEnrich] = useTransition();
  const [enrichNote, setEnrichNote] = useState<string | null>(null);

  const handleEnrich = () => {
    setEnrichNote(null);
    startEnrich(async () => {
      const v = getValues();
      const res = await enrichPersonAction({
        name: v.name,
        company: v.company,
        role: v.role,
        links: v.links,
      });
      if (res.error || !res.suggestion) {
        setEnrichNote(res.error ?? "Nothing found.");
        return;
      }

      const s = res.suggestion;
      const filled: string[] = [];
      const set = (key: keyof PersonFormValues, value: string, label: string) => {
        if (value && !v[key]) {
          setValue(key, value, { shouldDirty: true, shouldValidate: true });
          filled.push(label);
        }
      };
      set("role", s.role ?? "", "role");
      set("company", s.company ?? "", "company");
      set("location", s.location ?? "", "location");
      set("notes", s.notes ?? "", "notes");

      const newLinks = s.links.filter((l) => !v.links.includes(l));
      if (newLinks.length) {
        setValue("links", [...v.links, ...newLinks], { shouldDirty: true });
        filled.push(`${newLinks.length} link${newLinks.length > 1 ? "s" : ""}`);
      }
      const newTags = s.tags.filter((t) => !v.tags.includes(t));
      if (newTags.length) {
        setValue("tags", [...v.tags, ...newTags], { shouldDirty: true });
        filled.push(`${newTags.length} tag${newTags.length > 1 ? "s" : ""}`);
      }

      const parts = [
        filled.length ? `Filled ${filled.join(", ")}.` : "Nothing new to add.",
        s.sources.length ? `Source: ${s.sources.join(" + ")}.` : "",
        ...s.warnings,
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

      <div className="rounded-lg border border-dashed border-border bg-muted/30 p-3">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            Type a name, then let the agent pull GitHub + a profile draft.
          </p>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={enriching || !name?.trim()}
            onClick={handleEnrich}
          >
            {enriching ? (
              <Loader2 className="mr-1.5 animate-spin" size={14} />
            ) : (
              <Sparkles className="mr-1.5" size={14} />
            )}
            Auto-fill with AI
          </Button>
        </div>
        {enrichNote && (
          <p className="mt-2 text-xs text-muted-foreground">{enrichNote}</p>
        )}
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
