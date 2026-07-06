"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Sparkles,
  MessageCircleQuestion,
  Target,
  CalendarDays,
  Github,
  Linkedin,
  Twitter,
  Instagram,
  Tags,
  MapPin,
  Plus,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { BeryWordmark } from "@/components/bery-logo";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
}

const MAIN_NAV: NavItem[] = [
  { href: "/people", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/people/all", label: "People", icon: Users },
  { href: "/people/ask", label: "Ask", icon: MessageCircleQuestion },
  { href: "/people/map", label: "Map", icon: MapPin },
  { href: "/people/goals", label: "Goals", icon: Target },
  { href: "/people/research", label: "Research", icon: Sparkles },
  { href: "/people/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/people/tags", label: "Tags", icon: Tags },
];

const NETWORK_NAV: NavItem[] = [
  { href: "/people/network/github", label: "GitHub", icon: Github },
  { href: "/people/network/linkedin", label: "LinkedIn", icon: Linkedin },
  { href: "/people/network/x", label: "X", icon: Twitter },
  { href: "/people/network/instagram", label: "Instagram", icon: Instagram },
];

function isActive(pathname: string, item: NavItem): boolean {
  return item.exact ? pathname === item.href : pathname.startsWith(item.href);
}

function NavLink({ item, pathname }: { item: NavItem; pathname: string }) {
  const active = isActive(pathname, item);
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      className={cn(
        "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all duration-200 ease-out",
        active
          ? "font-medium text-foreground"
          : "text-muted-foreground hover:translate-x-0.5 hover:bg-foreground/5 hover:text-foreground",
      )}
    >
      <Icon
        size={17}
        className={cn(
          "transition-colors",
          active ? "text-berry" : "group-hover:text-foreground",
        )}
      />
      {item.label}
      {active && (
        <span className="ml-auto h-1.5 w-1.5 rounded-full bg-berry" aria-hidden />
      )}
    </Link>
  );
}

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="theme-fade sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-border bg-card/50 p-4 md:flex">
      <Link href="/people" className="mb-6 px-2">
        <BeryWordmark />
      </Link>

      <nav className="flex flex-1 flex-col gap-1">
        {MAIN_NAV.map((item) => (
          <NavLink key={item.href} item={item} pathname={pathname} />
        ))}

        <p className="mb-1 mt-5 px-3 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70">
          Networks
        </p>
        {NETWORK_NAV.map((item) => (
          <NavLink key={item.href} item={item} pathname={pathname} />
        ))}
      </nav>

      <Button asChild className="mt-4">
        <Link href="/people/new">
          <Plus className="mr-1.5" size={16} />
          Add person
        </Link>
      </Button>
    </aside>
  );
}

export function MobileNav() {
  const pathname = usePathname();

  return (
    <div className="theme-fade sticky top-0 z-10 border-b border-border bg-background/90 backdrop-blur md:hidden">
      <div className="flex items-center justify-between px-4 py-3">
        <Link href="/people">
          <BeryWordmark markSize={18} />
        </Link>
        <Button asChild size="sm">
          <Link href="/people/new">
            <Plus className="mr-1" size={15} />
            Add
          </Link>
        </Button>
      </div>
      <nav className="flex gap-1 overflow-x-auto px-3 pb-2">
        {[...MAIN_NAV, ...NETWORK_NAV].map((item) => {
          const active = isActive(pathname, item);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "whitespace-nowrap rounded-full px-3 py-1 text-xs transition-colors",
                active
                  ? "bg-berry/15 font-medium text-foreground"
                  : "text-muted-foreground hover:bg-foreground/5",
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
