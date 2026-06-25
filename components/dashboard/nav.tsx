"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Sparkles,
  Github,
  Linkedin,
  Twitter,
  Instagram,
  Tags,
  Plus,
  UserRound,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
}

const NAV: NavItem[] = [
  { href: "/people", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/people/all", label: "People", icon: Users },
  { href: "/people/research", label: "Research", icon: Sparkles },
  { href: "/people/network/github", label: "GitHub", icon: Github },
  { href: "/people/network/linkedin", label: "LinkedIn", icon: Linkedin },
  { href: "/people/network/x", label: "X", icon: Twitter },
  { href: "/people/network/instagram", label: "Instagram", icon: Instagram },
  { href: "/people/tags", label: "Tags", icon: Tags },
];

function isActive(pathname: string, item: NavItem): boolean {
  return item.exact ? pathname === item.href : pathname.startsWith(item.href);
}

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-border bg-card/40 p-4 md:flex">
      <Link
        href="/people"
        className="mb-6 flex items-center gap-2 px-2 font-semibold"
      >
        <UserRound size={18} className="text-[#e76f51]" />
        <span className="tracking-tight">Rolodex</span>
      </Link>

      <nav className="flex flex-1 flex-col gap-1">
        {NAV.map((item) => {
          const active = isActive(pathname, item);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-[#e76f51]/10 font-medium text-foreground"
                  : "text-muted-foreground hover:bg-foreground/5 hover:text-foreground",
              )}
            >
              <Icon
                size={17}
                className={active ? "text-[#e76f51]" : undefined}
              />
              {item.label}
            </Link>
          );
        })}
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
    <div className="sticky top-0 z-10 border-b border-border bg-background/90 backdrop-blur md:hidden">
      <div className="flex items-center justify-between px-4 py-3">
        <Link href="/people" className="flex items-center gap-2 font-semibold">
          <UserRound size={17} className="text-[#e76f51]" />
          Rolodex
        </Link>
        <Button asChild size="sm">
          <Link href="/people/new">
            <Plus className="mr-1" size={15} />
            Add
          </Link>
        </Button>
      </div>
      <nav className="flex gap-1 overflow-x-auto px-3 pb-2">
        {NAV.map((item) => {
          const active = isActive(pathname, item);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "whitespace-nowrap rounded-full px-3 py-1 text-xs transition-colors",
                active
                  ? "bg-[#e76f51]/15 font-medium text-foreground"
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
