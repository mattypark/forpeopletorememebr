import { cn } from "@/lib/utils";

interface BeryMarkProps {
  size?: number;
  className?: string;
}

/**
 * Placeholder berry mark — a strawberry-red drupe with a leaf. Swap the SVG
 * body for the real fruit logo when it lands; keep the component API.
 */
export function BeryMark({ size = 20, className }: BeryMarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      className={cn("shrink-0", className)}
    >
      <path
        d="M12 7.5c4.4 0 7 2.4 7 6 0 4.2-3.4 8-7 8s-7-3.8-7-8c0-3.6 2.6-6 7-6Z"
        className="fill-berry"
      />
      <path
        d="M12 7.5c.2-2.2 1.8-3.9 4-4.5-.1 2.3-1.7 4.1-4 4.5Zm0 0c-.2-2.2-1.8-3.9-4-4.5.1 2.3 1.7 4.1 4 4.5Z"
        className="fill-foreground/80"
      />
      <circle cx="9.6" cy="13.4" r="0.9" className="fill-berry-foreground/80" />
      <circle cx="14.4" cy="13.4" r="0.9" className="fill-berry-foreground/80" />
      <circle cx="12" cy="17" r="0.9" className="fill-berry-foreground/80" />
    </svg>
  );
}

interface BeryWordmarkProps {
  markSize?: number;
  className?: string;
}

export function BeryWordmark({ markSize = 20, className }: BeryWordmarkProps) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <BeryMark size={markSize} />
      <span className="font-serif text-lg font-semibold lowercase tracking-tight">
        bery<span className="text-berry">.</span>
      </span>
    </span>
  );
}
