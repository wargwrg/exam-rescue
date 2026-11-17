import type { ReactNode } from "react";
import { Icon, Logo } from "./ui";
import { useStore } from "../lib/store";
import { go } from "../lib/router";

const TABS = [
  { key: "today", label: "Today", icon: Icon.today },
  { key: "plan", label: "Plan", icon: Icon.plan },
  { key: "topics", label: "Topics", icon: Icon.topics },
  { key: "progress", label: "Progress", icon: Icon.progress },
] as const;

export function Shell({ active, children }: { active: string; children: ReactNode }) {
  const { access } = useStore();
  return (
    <div className="min-h-screen bg-[#F8FAFC] lg:flex">
      {/* laptop sidebar */}
      <aside className="hidden lg:flex w-[248px] shrink-0 bg-[#14213D] px-4 py-6 flex-col gap-6 sticky top-0 h-screen">
        <Logo size={18} />
        <nav aria-label="Main" className="flex flex-col gap-1">
          {[...TABS, { key: "settings", label: "Settings", icon: Icon.gear }].map((t) => (
            <a
              key={t.key}
              href={`#/${t.key}`}
              className={`flex items-center gap-2.5 h-11 px-3 rounded-[10px] text-sm no-underline ${
                active === t.key ? "bg-[#2563EB] text-white font-bold" : "text-[#CBD5E1] font-semibold hover:bg-[#1E2B4A]"
              }`}
            >
              {t.icon(20)}
              {t.label}
            </a>
          ))}
        </nav>
        <div className="mt-auto flex flex-col gap-1.5">
          <span className="text-[11px] font-extrabold text-[#94A3B8] tracking-wider px-3">CLUTCH UP TOOLS</span>
          <span className="flex items-center justify-between h-10 px-3 rounded-[10px] bg-[#1E2B4A] text-white text-sm font-bold">
            Exam Rescue <span className="w-2 h-2 rounded-full bg-[#4ADE80]" />
          </span>
          <span className="flex items-center justify-between h-10 px-3 text-[#94A3B8] text-sm font-semibold">
            More tools <span className="text-[11px] border border-[#475569] rounded-full px-2 py-0.5">Soon</span>
          </span>
        </div>
      </aside>

      <div className="flex-1 min-w-0 flex flex-col min-h-screen">
        {access?.kind === "trial" && (
          <a
            href="#/unlock"
            className="bg-[#14213D] lg:bg-[#FEF3C7] text-white lg:text-[#78350F] no-underline flex justify-between items-center px-5 lg:px-8 min-h-11 text-[13px] gap-2"
          >
            <span>
              <b>Free trial</b> · {access.daysLeft > 1 ? `${access.daysLeft} days left` : `${access.hoursLeft}h left`}
            </span>
            <span className="text-[#FCD34D] lg:text-[#78350F] font-extrabold">Unlock full plan</span>
          </a>
        )}
        <main className="flex-1 w-full max-w-[1100px] mx-auto px-5 lg:px-8 pb-28 lg:pb-12">{children}</main>
        {/* phone tab bar */}
        <nav
          aria-label="Main"
          className="lg:hidden fixed bottom-0 inset-x-0 h-[76px] bg-white border-t border-[#E2E8F0] flex justify-around items-start pt-2.5 z-40"
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => go(t.key)}
              className={`flex flex-col items-center gap-1 min-w-16 min-h-11 text-[11px] ${active === t.key ? "text-[#1D4ED8] font-bold" : "text-[#64748B] font-medium"}`}
              aria-current={active === t.key ? "page" : undefined}
            >
              {t.icon()}
              <span>{t.label}</span>
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}
