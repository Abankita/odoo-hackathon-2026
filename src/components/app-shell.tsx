"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Leaf, Menu, Shield, Settings, Sparkles, Users, ClipboardList, FileBarChart2, BadgeDollarSign, Factory } from "lucide-react";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

type NavHref = "/" | "/gamification" | "/environmental" | "/social" | "/governance" | "/reports" | "/settings";

type NavItem = { href: NavHref; label: string; icon: React.ComponentType<{ className?: string }>; section: string };

const navSections: Array<{ title: string; items: NavItem[] }> = [
  {
    title: "Core",
    items: [
      { href: "/", label: "Dashboard", icon: BarChart3, section: "dashboard" },
      { href: "/environmental", label: "Environmental", icon: Leaf, section: "environmental" },
      { href: "/social", label: "Social", icon: Users, section: "social" },
      { href: "/governance", label: "Governance", icon: Shield, section: "governance" }
    ]
  },
  {
    title: "Operational",
    items: [
      { href: "/gamification", label: "Gamification", icon: Sparkles, section: "gamification" },
      { href: "/reports", label: "Reports", icon: FileBarChart2, section: "reports" },
      { href: "/settings", label: "Settings", icon: Settings, section: "settings" }
    ]
  }
];

function ShellLink({ item }: { item: NavItem }) {
  const pathname = usePathname();
  const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
        active ? "bg-emerald-50 text-emerald-900" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
      )}
    >
      <Icon className={cn("h-4 w-4", active ? "text-emerald-700" : "text-slate-400")} />
      <span>{item.label}</span>
    </Link>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const title = useMemo(() => {
    if (pathname === "/") return "Dashboard";
    return pathname.slice(1).split("/")[0].replace(/^[a-z]/, (s) => s.toUpperCase());
  }, [pathname]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex min-h-screen">
        <aside className="hidden w-72 flex-col border-r border-border bg-white/80 backdrop-blur md:flex">
          <div className="px-6 py-6">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-700 text-white shadow-sm">
                <Factory className="h-5 w-5" />
              </div>
              <div>
                <div className="text-sm font-semibold uppercase tracking-[0.22em] text-emerald-700">EcoSphere</div>
                <div className="text-sm text-slate-500">ESG Management Platform</div>
              </div>
            </div>
          </div>
          <Separator />
          <nav className="flex-1 space-y-6 px-4 py-5">
            {navSections.map((section) => (
              <div key={section.title} className="space-y-2">
                <p className="px-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">{section.title}</p>
                <div className="space-y-1">
                  {section.items.map((item) => (
                    <ShellLink key={item.href} item={item} />
                  ))}
                </div>
              </div>
            ))}
          </nav>
        </aside>

        {open ? (
          <div className="fixed inset-0 z-40 bg-slate-950/40 md:hidden" onClick={() => setOpen(false)} />
        ) : null}
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-50 w-80 transform border-r border-border bg-white transition-transform duration-200 md:hidden",
            open ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <div className="flex items-center justify-between px-5 py-5">
            <div>
              <div className="text-sm font-semibold uppercase tracking-[0.22em] text-emerald-700">EcoSphere</div>
              <div className="text-sm text-slate-500">ESG Management Platform</div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>Close</Button>
          </div>
          <Separator />
          <nav className="space-y-6 px-4 py-5">
            {navSections.map((section) => (
              <div key={section.title} className="space-y-2">
                <p className="px-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">{section.title}</p>
                <div className="space-y-1">
                  {section.items.map((item) => (
                    <div key={item.href} onClick={() => setOpen(false)}>
                      <ShellLink item={item} />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </nav>
        </aside>

        <main className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur">
            <div className="flex items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
              <div className="flex items-center gap-3 md:hidden">
                <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
                  <Menu className="h-4 w-4" />
                  Menu
                </Button>
                <div>
                  <p className="text-sm font-semibold text-slate-900">{title}</p>
                  <p className="text-xs text-slate-500">EcoSphere command center</p>
                </div>
              </div>
              <div className="hidden md:block">
                <p className="text-sm font-semibold text-slate-900">{title}</p>
                <p className="text-xs text-slate-500">EcoSphere command center</p>
              </div>
              <div className="hidden md:flex items-center gap-2">
                <Button variant="outline" size="sm" asChild={false}>
                  <Link href="/reports">Reports</Link>
                </Button>
                <Button size="sm" asChild={false}>
                  <Link href="/gamification">Gamification</Link>
                </Button>
              </div>
            </div>
          </header>
          <div className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
