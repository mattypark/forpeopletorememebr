import Avatar from "boring-avatars";
import Image from "next/image";

const PALETTE = ["#f4a259", "#e76f51", "#2a9d8f", "#264653", "#e9c46a"];

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
        className={`rounded-full object-cover ${className ?? ""}`}
        style={{ width: size, height: size }}
        unoptimized
      />
    );
  }

  return (
    <span
      className={`inline-flex overflow-hidden rounded-full ${className ?? ""}`}
      style={{ width: size, height: size }}
      aria-hidden
    >
      <Avatar size={size} name={name || "?"} variant="beam" colors={PALETTE} />
    </span>
  );
}
