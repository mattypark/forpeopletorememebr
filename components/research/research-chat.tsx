"use client";

import { useRef, useState, useEffect, type FormEvent } from "react";
import {
  Sparkles,
  Send,
  Loader2,
  ExternalLink,
  Save,
  Globe,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { detectLink } from "@/lib/people/links";
import {
  researchChatAction,
  createPerson,
  type ResearchState,
} from "@/lib/people/actions";
import type { ResearchMessage } from "@/lib/people/research";
import type { ResearchDraft } from "@/lib/people/research";
import type { GroundingSource } from "@/lib/people/enrich/gemini";

const EMPTY_DRAFT: ResearchDraft = {
  name: "",
  role: "",
  company: "",
  location: "",
  email: "",
  summary: "",
  tags: [],
  links: [],
};

function mergeDraft(prev: ResearchDraft | null, next: ResearchDraft): ResearchDraft {
  const base = prev ?? EMPTY_DRAFT;
  const pick = (a: string, b: string) => (b.trim() ? b : a);
  return {
    name: pick(base.name, next.name),
    role: pick(base.role, next.role),
    company: pick(base.company, next.company),
    location: pick(base.location, next.location),
    email: pick(base.email, next.email),
    summary: pick(base.summary, next.summary),
    tags: [...new Set([...base.tags, ...next.tags])],
    links: [...new Set([...base.links, ...next.links])],
  };
}

const SUGGESTION =
  "e.g. “Sarah Chen, founder I met at the AI dinner in SF, works in climate tech”";

export function ResearchChat() {
  const [messages, setMessages] = useState<ResearchMessage[]>([]);
  const [draft, setDraft] = useState<ResearchDraft | null>(null);
  const [sources, setSources] = useState<GroundingSource[]>([]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);

  const [phone, setPhone] = useState("");
  const [metContext, setMetContext] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const threadRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    threadRef.current?.scrollTo({ top: threadRef.current.scrollHeight });
  }, [messages, pending]);

  const send = async (e: FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || pending) return;

    const next: ResearchMessage[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    setPending(true);

    const res: ResearchState = await researchChatAction(next);
    setPending(false);

    setMessages([
      ...next,
      { role: "assistant", content: res.reply || res.error || "No response." },
    ]);
    if (res.draft) setDraft((prev) => mergeDraft(prev, res.draft!));
    if (res.sources.length) setSources(res.sources);
  };

  const update = (field: keyof ResearchDraft, value: string) =>
    setDraft((prev) => ({ ...(prev ?? EMPTY_DRAFT), [field]: value }));

  const save = async () => {
    if (!draft?.name.trim()) {
      setSaveError("A name is required to save.");
      return;
    }
    setSaving(true);
    setSaveError(null);
    const result = await createPerson({
      name: draft.name,
      role: draft.role,
      company: draft.company,
      location: draft.location,
      email: draft.email,
      phone,
      needs: "",
      notes: draft.summary,
      metContext,
      metAt: "",
      tags: draft.tags,
      links: draft.links,
      photoPath: null,
    });
    // Success redirects to the new person; only an error returns here.
    if (result?.error) {
      setSaving(false);
      setSaveError(result.error);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      {/* Chat column */}
      <div className="flex h-[70vh] flex-col rounded-xl border border-border bg-card">
        <div ref={threadRef} className="flex-1 space-y-4 overflow-y-auto p-4">
          {messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <Sparkles className="mb-3 text-[#e76f51]" size={28} />
              <p className="font-serif text-lg font-semibold">
                Research a person
              </p>
              <p className="mt-1 max-w-xs text-sm text-muted-foreground">
                Describe who you met — name plus anything you know. I&apos;ll
                search the web for their public profiles and build a draft.
              </p>
              <p className="mt-3 max-w-xs text-xs text-muted-foreground">
                {SUGGESTION}
              </p>
            </div>
          ) : (
            messages.map((m, i) => (
              <div
                key={i}
                className={cn(
                  "flex",
                  m.role === "user" ? "justify-end" : "justify-start",
                )}
              >
                <div
                  className={cn(
                    "max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2 text-sm",
                    m.role === "user"
                      ? "bg-[#e76f51] text-white"
                      : "bg-muted text-foreground",
                  )}
                >
                  {m.content}
                </div>
              </div>
            ))
          )}
          {pending && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="animate-spin" size={14} />
              Searching the web…
            </div>
          )}
        </div>

        {sources.length > 0 && (
          <div className="border-t border-border px-4 py-2">
            <p className="mb-1 flex items-center gap-1 text-xs font-medium text-muted-foreground">
              <Globe size={12} /> Sources
            </p>
            <div className="flex flex-wrap gap-1.5">
              {sources.slice(0, 6).map((s, i) => (
                <a
                  key={i}
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex max-w-[180px] items-center gap-1 truncate rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground hover:text-foreground"
                >
                  <span className="truncate">{s.title}</span>
                  <ExternalLink size={10} className="shrink-0" />
                </a>
              ))}
            </div>
          </div>
        )}

        <form onSubmit={send} className="flex gap-2 border-t border-border p-3">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Describe the person, or ask a follow-up…"
            disabled={pending}
          />
          <Button type="submit" size="icon" disabled={pending || !input.trim()}>
            <Send size={16} />
          </Button>
        </form>
      </div>

      {/* Draft column */}
      <aside className="space-y-4 rounded-xl border border-border bg-card p-4 lg:sticky lg:top-4 lg:self-start">
        <h2 className="font-serif text-lg font-semibold tracking-tight">Draft</h2>

        {!draft ? (
          <p className="text-sm text-muted-foreground">
            The profile will fill in here as the AI finds details. You add the
            private bits — phone and where you met.
          </p>
        ) : (
          <div className="space-y-3">
            <DraftField label="Name" value={draft.name} onChange={(v) => update("name", v)} />
            <DraftField label="Role" value={draft.role} onChange={(v) => update("role", v)} />
            <DraftField label="Company" value={draft.company} onChange={(v) => update("company", v)} />
            <DraftField label="Location" value={draft.location} onChange={(v) => update("location", v)} />
            <DraftField label="Email" value={draft.email} onChange={(v) => update("email", v)} />

            {draft.links.length > 0 && (
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Links found</Label>
                <ul className="space-y-1">
                  {draft.links.map((url) => {
                    const link = detectLink(url);
                    return (
                      <li key={url} className="truncate text-xs">
                        <span className="font-medium">{link.platform}</span>{" "}
                        <span className="text-muted-foreground">{link.handle}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            {draft.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {draft.tags.map((t) => (
                  <Badge key={t} variant="secondary" className="font-normal">
                    {t}
                  </Badge>
                ))}
              </div>
            )}

            <div className="space-y-3 rounded-lg border border-dashed border-border p-3">
              <p className="text-xs font-medium text-muted-foreground">
                Only you know these:
              </p>
              <DraftField
                label="Phone"
                value={phone}
                onChange={setPhone}
                placeholder="+1 555 123 4567"
              />
              <DraftField
                label="Where we met"
                value={metContext}
                onChange={setMetContext}
                placeholder="YC dinner, mutual friend…"
              />
            </div>

            {saveError && <p className="text-xs text-destructive">{saveError}</p>}

            <Button onClick={save} disabled={saving || !draft.name.trim()} className="w-full">
              {saving ? (
                <Loader2 className="mr-1.5 animate-spin" size={15} />
              ) : (
                <Save className="mr-1.5" size={15} />
              )}
              Save to Rolodex
            </Button>
          </div>
        )}
      </aside>
    </div>
  );
}

interface DraftFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

function DraftField({ label, value, onChange, placeholder }: DraftFieldProps) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-8 text-sm"
      />
    </div>
  );
}
