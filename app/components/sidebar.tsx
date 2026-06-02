"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/recruiter", label: "Recruiter Portal" },
  { href: "/admin", label: "Admin Insights" },
] as const;

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex w-56 shrink-0 flex-col border-r border-slate-800/80 bg-[#0f172a] text-slate-100">
      <div className="border-b border-slate-700/60 px-5 py-6">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
          Compensation
        </p>
        <p className="mt-1 font-semibold tracking-tight text-white">Workbench</p>
      </div>
      <nav className="flex flex-col gap-0.5 p-3" aria-label="Main">
        {navItems.map(({ href, label }) => {
          const active =
            pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              className={[
                "rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-sky-500/15 text-sky-50 ring-1 ring-sky-500/40"
                  : "text-slate-400 hover:bg-slate-800/80 hover:text-slate-100",
              ].join(" ")}
            >
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
