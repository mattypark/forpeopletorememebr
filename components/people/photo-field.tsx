"use client";

import { useRef, useState, type ChangeEvent } from "react";
import imageCompression from "browser-image-compression";
import { Loader2, Upload, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { PersonAvatar } from "./person-avatar";

const AVATAR_BUCKET = "avatars";

interface PhotoFieldProps {
  name: string;
  photoPath: string | null;
  previewUrl: string | null;
  onChange: (photoPath: string | null) => void;
}

export function PhotoField({
  name,
  photoPath,
  previewUrl,
  onChange,
}: PhotoFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [localPreview, setLocalPreview] = useState<string | null>(previewUrl);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setBusy(true);
    setError(null);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not signed in");

      const compressed = await imageCompression(file, {
        maxSizeMB: 0.3,
        maxWidthOrHeight: 512,
        fileType: "image/webp",
        useWebWorker: true,
      });

      const newPath = `${user.id}/${crypto.randomUUID()}.webp`;
      const { error: uploadError } = await supabase.storage
        .from(AVATAR_BUCKET)
        .upload(newPath, compressed, {
          contentType: "image/webp",
          upsert: true,
        });
      if (uploadError) throw uploadError;

      // Clean up the previously uploaded image so it doesn't orphan.
      if (photoPath && photoPath !== newPath) {
        await supabase.storage.from(AVATAR_BUCKET).remove([photoPath]);
      }

      setLocalPreview(URL.createObjectURL(compressed));
      onChange(newPath);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const handleRemove = async () => {
    if (photoPath) {
      const supabase = createClient();
      await supabase.storage.from(AVATAR_BUCKET).remove([photoPath]);
    }
    setLocalPreview(null);
    onChange(null);
  };

  return (
    <div className="flex items-center gap-4">
      <PersonAvatar name={name} photoUrl={localPreview} size={72} />
      <div className="space-y-1">
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
          >
            {busy ? (
              <Loader2 className="mr-1.5 animate-spin" size={14} />
            ) : (
              <Upload className="mr-1.5" size={14} />
            )}
            {localPreview ? "Replace" : "Upload photo"}
          </Button>
          {localPreview && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={busy}
              onClick={handleRemove}
            >
              <X className="mr-1.5" size={14} />
              Remove
            </Button>
          )}
        </div>
        {error && <p className="text-xs text-destructive">{error}</p>}
        <p className="text-xs text-muted-foreground">
          Resized to 512px WebP before upload.
        </p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleSelect}
      />
    </div>
  );
}
