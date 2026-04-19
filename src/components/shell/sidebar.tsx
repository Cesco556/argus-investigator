"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Inbox,
  FileSearch,
  Network,
  GitBranch,
  ShieldAlert,
  Users,
  BookOpen,
  Settings,
  Rss,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CASES, ENTITIES, TYPOLOGY_PLAYBOOKS } from "@/lib/data/fixtures";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  count?: number;
  kbd?: string;
};

const inboxCount = CASES.length;
const casesCount = CASES.length;
const entitiesCount = Object.keys(ENTITIES).length;
const playbooksCount = TYPOLOGY_PLAYBOOKS.length;

const primary: NavItem[] = [
  { href: "/", label: "Overview", icon: ShieldAlert, kbd: "⌘1" },
  { href: "/inbox", label: "Alert inbox", icon: Inbox, count: inboxCount, kbd: "⌘2" },
  { href: "/cases", label: "Cases", icon: FileSearch, count: casesCount, kbd: "⌘3" },
  { href: "/entities", label: "Entities", icon: Users, count: entitiesCount, kbd: "⌘4" },
  { href: "/graph", label: "Network graph", icon: Network, kbd: "⌘5" },
  { href: "/trail", label: "Suspicion Trail", icon: GitBranch, kbd: "⌘6" },
];

const secondary: NavItem[] = [
  { href: "/playbooks", label: "Typology playbooks", icon: BookOpen, count: playbooksCount },
  { href: "/intel", label: "Regulatory intel", icon: Rss },
  { href: "/settings", label: "Settings", icon: Settings },
];

function NavLink({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      className={cn(
        "group relative flex items-center gap-3 rounded-md px-2.5 py-1.5 text-sm transition-colors",
        "text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-accent",
        active && "bg-sidebar-accent text-sidebar-foreground",
      )}
    >
      <span
        className={cn(
          "absolute left-0 h-4 w-[2px] rounded-r-full transition-all",
          active ? "bg-sidebar-primary" : "bg-transparent group-hover:bg-sidebar-border",
        )}
      />
      <Icon className={cn("h-4 w-4 shrink-0", active ? "text-sidebar-primary" : "text-sidebar-foreground/60")} />
      <span className="flex-1 truncate">{item.label}</span>
      {typeof item.count === "number" && (
        <span className="font-mono text-[10px] tabular-nums text-sidebar-foreground/60">
          {item.count}
        </span>
      )}
      {item.kbd && (
        <kbd className="hidden font-mono text-[10px] text-sidebar-foreground/40 group-hover:text-sidebar-foreground/60 lg:inline">
          {item.kbd}
        </kbd>
      )}
    </Link>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <aside className="flex h-full w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar">
      <div className="flex h-14 items-center gap-2.5 border-b border-sidebar-border px-4">
        <div className="relative flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-primary to-primary/70 shadow-lg shadow-primary/20">
          <span className="font-mono text-[11px] font-bold text-primary-foreground">A</span>
        </div>
        <div className="flex flex-col leading-none">
          <span className="text-[13px] font-semibold tracking-tight text-sidebar-foreground">Argus</span>
          <span className="font-mono text-[9px] uppercase tracking-wider text-sidebar-foreground/50">
            AML Intelligence
          </span>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto scroll-area-thin px-2 py-3">
        <div className="mb-3">
          <div className="px-2 pb-1.5 font-mono text-[9px] uppercase tracking-wider text-sidebar-foreground/40">
            Workspace
          </div>
          <div className="flex flex-col gap-0.5">
            {primary.map((item) => (
              <NavLink key={item.href} item={item} active={isActive(item.href)} />
            ))}
          </div>
        </div>
        <div>
          <div className="px-2 pb-1.5 font-mono text-[9px] uppercase tracking-wider text-sidebar-foreground/40">
            Reference
          </div>
          <div className="flex flex-col gap-0.5">
            {secondary.map((item) => (
              <NavLink key={item.href} item={item} active={isActive(item.href)} />
            ))}
          </div>
        </div>
      </nav>

      <div className="border-t border-sidebar-border p-3">
        <div className="flex items-center gap-2.5 rounded-md bg-sidebar-accent/50 px-2.5 py-2">
          <div className="h-2 w-2 shrink-0 rounded-full bg-risk-low shadow-[0_0_8px] shadow-risk-low/50" />
          <div className="flex min-w-0 flex-col leading-tight">
            <span className="truncate text-[11px] font-medium text-sidebar-foreground">Engine online</span>
            <span className="truncate font-mono text-[9px] text-sidebar-foreground/50">v0.9 · uk-south</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
