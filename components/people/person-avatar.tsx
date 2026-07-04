import Avatar from "boring-avatars";
import Image from "next/image";

const PALETTE = ["#cf2250", "#e8b04b", "#3a5a40", "#22181c", "#f2e4ce"];

interface PersonAvatarProps {
  name: string;
  photoUrl: string | null;
  size?: number;
  className?: string;
}

/**
 * Shows the contact photo when present, otherwise a deterministic generative
 * avatar seeded from the name so every person stays visually distinct.
 */
export function PersonAvatar({
  name,
  photoUrl,
  size = 48,
  className,
}: PersonAvatarProps) {
  if (photoUrl) {
    return (
      <Image
        src={photoUrl}
        alt={name}
        width={size}
        height={size}
        className={`rounded-full object-cover ring-1 ring-black/10 dark:ring-white/10 ${className ?? ""}`}
        style={{ width: size, height: size }}
        unoptimized
      />
    );
  }

  return (
    <span
      className={`inline-flex overflow-hidden rounded-full ring-1 ring-black/10 dark:ring-white/10 ${className ?? ""}`}
      style={{ width: size, height: size }}
      aria-hidden
    >
      <Avatar size={size} name={name || "?"} variant="beam" colors={PALETTE} />
    </span>
  );
}
