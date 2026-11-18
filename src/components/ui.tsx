import { useEffect, type ReactNode } from "react";
import type { PriorityLabel } from "../lib/engine";

// ---------------------------------------------------------------- icons (inline, stroke)
const P = { fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
export const Icon = {
  today: (s = 22) => (
    <svg width={s} height={s} viewBox="0 0 24 24" {...P} aria-hidden="true"><path d="M3 11l9-7 9 7" /><path d="M5 10v10h14V10" /></svg>
  ),
  plan: (s = 22) => (
    <svg width={s} height={s} viewBox="0 0 24 24" {...P} aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></svg>
  ),
  topics: (s = 22) => (
    <svg width={s} height={s} viewBox="0 0 24 24" {...P} aria-hidden="true"><path d="M8 6h13M8 12h13M8 18h13" /><circle cx="4" cy="6" r="1" /><circle cx="4" cy="12" r="1" /><circle cx="4" cy="18" r="1" /></svg>
  ),
  progress: (s = 22) => (
    <svg width={s} height={s} viewBox="0 0 24 24" {...P} aria-hidden="true"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /></svg>
  ),
  gear: (s = 22) => (
    <svg width={s} height={s} viewBox="0 0 24 24" {...P} aria-hidden="true"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z" /></svg>
  ),
  check: (s = 16) => (
    <svg width={s} height={s} viewBox="0 0 24 24" {...P} strokeWidth={3} aria-hidden="true"><path d="M5 12l5 5 9-10" /></svg>
  ),
  back: (s = 22) => (
    <svg width={s} height={s} viewBox="0 0 24 24" {...P} aria-hidden="true"><path d="M15 18l-6-6 6-6" /></svg>
  ),
  plus: (s = 20) => (
    <svg width={s} height={s} viewBox="0 0 24 24" {...P} strokeWidth={2.5} aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
  ),
  search: (s = 18) => (
    <svg width={s} height={s} viewBox="0 0 24 24" {...P} aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="M20 20l-4-4" /></svg>
  ),
  alert: (s = 18) => (
    <svg width={s} height={s} viewBox="0 0 24 24" {...P} aria-hidden="true"><path d="M12 9v4M12 17h.01" /><path d="M10.3 3.9L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z" /></svg>
  ),
  lock: (s = 16) => (
    <svg width={s} height={s} viewBox="0 0 24 24" {...P} aria-hidden="true"><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 018 0v4" /></svg>
  ),
  trash: (s = 18) => (
    <svg width={s} height={s} viewBox="0 0 24 24" {...P} aria-hidden="true"><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14" /></svg>
  ),
  x: (s = 20) => (
    <svg width={s} height={s} viewBox="0 0 24 24" {...P} aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
  ),
  chevron: (s = 18) => (
    <svg width={s} height={s} viewBox="0 0 24 24" {...P} aria-hidden="true"><path d="M9 6l6 6-6 6" /></svg>
  ),
};

// ---------------------------------------------------------------- brand
export function Logo({ dark = true, size = 20, subtitle = true }: { dark?: boolean; size?: number; subtitle?: boolean }) {
  // Wordmark images live in /public/brand. White version on dark backgrounds, blue version on light ones.
  const src = dark ? "/brand/clutchup-white.png" : "/brand/clutchup-blue.png";
  return (
    <div className="flex flex-col items-start gap-1.5">
      <img src={src} alt="Clutch Up!" style={{ height: size * 1.4, width: "auto" }} draggable={false} />
      {subtitle && (
        <span className={`font-semibold tracking-wide ${dark ? "text-[#93C5FD]" : "text-[#0038D1]"}`} style={{ fontSize: size * 0.62 }}>
          Exam Rescue
        </span>
      )}
    </div>
  );
}

// ---------------------------------------------------------------- small pieces
export function Dot({ color }: { color: string }) {
  return <span aria-hidden="true" className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: color }} />;
}

const BADGE: Record<string, string> = {
  High: "bg-[#DC2626] text-white",
  Medium: "bg-[#FDE68A] text-[#78350F]",
  Low: "bg-[#DBEAFE] text-[#1E3A8A]",
  Mastered: "bg-[#DCFCE7] text-[#14532D]",
  "Past paper": "bg-[#EDE9FE] text-[#4C1D95]",
  Buffer: "bg-[#E2E8F0] text-[#334155]",
};
export function Badge({ label }: { label: PriorityLabel | "Past paper" | "Buffer" }) {
  return <span className={`text-[11px] font-bold px-2 py-[3px] rounded-full whitespace-nowrap ${BADGE[label]}`}>{label}</span>;
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`bg-white border border-[#E2E8F0] rounded-2xl ${className}`}>{children}</div>;
}

export function Bar({ pct, color = "#2563EB", h = 6 }: { pct: number; color?: string; h?: number }) {
  return (
    <div aria-hidden="true" className="w-full rounded-full bg-[#E2E8F0] overflow-hidden" style={{ height: h }}>
      <div className="h-full rounded-full" style={{ width: `${Math.max(0, Math.min(100, pct))}%`, background: color }} />
    </div>
  );
}

export function PrimaryButton(p: { children: ReactNode; onClick?: () => void; disabled?: boolean; type?: "button" | "submit"; className?: string }) {
  return (
    <button
      type={p.type ?? "button"}
      onClick={p.onClick}
      disabled={p.disabled}
      className={`h-[54px] w-full rounded-2xl bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-50 text-white font-bold text-base flex items-center justify-center gap-2 ${p.className ?? ""}`}
    >
      {p.children}
    </button>
  );
}

export function SecondaryButton(p: { children: ReactNode; onClick?: () => void; className?: string; type?: "button" | "submit" }) {
  return (
    <button
      type={p.type ?? "button"}
      onClick={p.onClick}
      className={`min-h-11 px-4 rounded-xl border border-[#CBD5E1] bg-white text-[#0F172A] font-semibold text-sm flex items-center justify-center gap-1.5 hover:bg-[#F8FAFC] ${p.className ?? ""}`}
    >
      {p.children}
    </button>
  );
}

export function Segmented<T extends string | number>(p: { options: { value: T; label: string }[]; value: T; onChange: (v: T) => void; label: string }) {
  return (
    <div role="group" aria-label={p.label} className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${p.options.length}, minmax(0, 1fr))` }}>
      {p.options.map((o) => {
        const on = o.value === p.value;
        return (
          <button
            key={String(o.value)}
            type="button"
            aria-pressed={on}
            onClick={() => p.onChange(o.value)}
            className={`h-11 rounded-[10px] text-[15px] ${on ? "border-2 border-[#2563EB] bg-[#EFF6FF] text-[#1D4ED8] font-bold" : "border border-[#CBD5E1] bg-white text-[#0F172A] font-semibold"}`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export function Stepper(p: { value: number; onChange: (v: number) => void; step?: number; min?: number; max?: number; label: string; suffix?: string }) {
  const step = p.step ?? 0.5;
  const set = (v: number) => p.onChange(Math.max(p.min ?? 0, Math.min(p.max ?? 24, Math.round(v * 100) / 100)));
  return (
    <div className="flex items-center gap-2">
      <button type="button" aria-label={`Less ${p.label}`} onClick={() => set(p.value - step)} className="w-9 h-9 rounded-[10px] border border-[#CBD5E1] bg-white text-lg">−</button>
      <span className="w-12 text-center font-bold text-[15px]">
        {p.value}
        {p.suffix ?? "h"}
      </span>
      <button type="button" aria-label={`More ${p.label}`} onClick={() => set(p.value + step)} className="w-9 h-9 rounded-[10px] border border-[#CBD5E1] bg-white text-lg">+</button>
    </div>
  );
}

export function Toggle(p: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={p.on}
      aria-label={p.label}
      onClick={() => p.onChange(!p.on)}
      className={`relative w-12 h-7 rounded-full shrink-0 ${p.on ? "bg-[#2563EB]" : "bg-[#CBD5E1]"}`}
    >
      <span className={`absolute top-[3px] w-[22px] h-[22px] rounded-full bg-white transition-all ${p.on ? "right-[3px]" : "left-[3px]"}`} />
    </button>
  );
}

export function Label({ children, htmlFor }: { children: ReactNode; htmlFor?: string }) {
  return (
    <label htmlFor={htmlFor} className="text-xs font-bold text-[#475569] tracking-wide uppercase">
      {children}
    </label>
  );
}

export const inputCls =
  "h-11 w-full border border-[#CBD5E1] rounded-[10px] px-3 text-[15px] bg-white text-[#0F172A] focus:outline-2 focus:outline-[#2563EB]";

/** Bottom sheet on phones, centred dialog on laptops. */
export function Sheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center">
      <button aria-label="Close" className="absolute inset-0 bg-[#0F172A]/55" onClick={onClose} />
      <section
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative w-full lg:max-w-lg bg-white rounded-t-3xl lg:rounded-3xl px-6 pt-3 pb-7 max-h-[92vh] overflow-y-auto"
      >
        <div aria-hidden="true" className="w-10 h-[5px] rounded-full bg-[#CBD5E1] mx-auto mb-3 lg:hidden" />
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-extrabold">{title}</h2>
          <button aria-label="Close" onClick={onClose} className="w-11 h-11 -mr-3 flex items-center justify-center text-[#475569]">
            {Icon.x()}
          </button>
        </div>
        {children}
      </section>
    </div>
  );
}

export function PageHeader({ eyebrow, title, right }: { eyebrow?: ReactNode; title: string; right?: ReactNode }) {
  return (
    <header className="pt-7 pb-3 flex justify-between items-end gap-3">
      <div className="flex flex-col gap-1">
        {eyebrow && <span className="text-[13px] font-semibold text-[#475569]">{eyebrow}</span>}
        <h1 className="m-0 text-[26px] lg:text-[32px] font-extrabold tracking-tight">{title}</h1>
      </div>
      {right}
    </header>
  );
}

export function BackHeader({ onBack, children }: { onBack: () => void; children?: ReactNode }) {
  return (
    <header className="pt-4 pb-2 flex items-center gap-1.5">
      <button aria-label="Back" onClick={onBack} className="w-11 h-11 -ml-3 flex items-center justify-center text-[#0F172A]">
        {Icon.back()}
      </button>
      {children}
    </header>
  );
}

export function fmtH(h: number) {
  return `${Math.round(h * 10) / 10}h`;
}
