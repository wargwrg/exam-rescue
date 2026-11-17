import { useMemo, useState } from "react";
import { useStore } from "../lib/store";
import { addDays, diffDays, fmtLong, fmtShort } from "../lib/dates";
import { hoursThisWeek, studyStreak, type Session } from "../lib/engine";
import { Badge, Bar, Card, Dot, Icon, fmtH } from "../components/ui";
import { LogSheet, type LogPreset } from "../components/LogSheet";

export function Today() {
  const { data, plan, today } = useStore();
  const [logging, setLogging] = useState<LogPreset | "free" | null>(null);
  const subj = (id: string) => data.subjects.find((s) => s.id === id);
  const topic = (id: string | null) => (id ? data.topics.find((t) => t.id === id) : undefined);
  const tm = (id: string | null) => (id ? plan.topics.find((t) => t.topic.id === id) : undefined);

  const todays = plan.sessions.filter((s) => s.date === today);
  const doneToday = data.logs.filter((l) => l.date === today);
  const totalToday = todays.length + doneToday.length;
  const hour = new Date().getHours();
  const greet = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const exams = plan.subjects.filter((s) => s.open).sort((a, b) => (a.daysLeft ?? 0) - (b.daysLeft ?? 0));
  const streak = studyStreak(data, today);
  const week = hoursThisWeek(data, today);
  const weekTarget = data.weekly.reduce((a, b) => a + b, 0);
  const high = plan.topics.filter((t) => t.label === "High" && t.active).sort((a, b) => b.score - a.score);

  const alerts = useMemo(() => {
    const out: { tone: "red" | "amber" | "blue"; text: string; href?: string }[] = [];
    for (const s of plan.subjects) if (s.open && s.shortfall > 0) out.push({ tone: "red", text: `${s.subject.name}: ${fmtH(s.shortfall)} won't fit before the exam. Add study time or trim low-priority topics.`, href: "#/plan" });
    for (const s of plan.subjects) if (s.open && s.daysLeft !== null && s.daysLeft <= 7) out.push({ tone: "amber", text: `${s.subject.name} exam in ${s.daysLeft} day${s.daysLeft === 1 ? "" : "s"}. Past papers are in your plan.` });
    if (high.length) out.push({ tone: "red", text: `${high.length} high-priority topic${high.length > 1 ? "s" : ""} need attention. Top: ${high[0].topic.name}`, href: "#/topics" });
    const last = data.logs.reduce<string | null>((m, l) => (!m || l.date > m ? l.date : m), null);
    if (last && diffDays(today, last) >= 3) out.push({ tone: "amber", text: `No study logged for ${diffDays(today, last)} days. Your plan has been re-balanced, so just start with today.` });
    const stale = plan.topics.filter((t) => {
      if (t.topic.mastered || !t.active) return false;
      const ls = data.logs.filter((l) => l.topicId === t.topic.id).map((l) => l.date).sort();
      return ls.length > 0 && diffDays(today, ls[ls.length - 1]) >= 14;
    });
    if (stale.length) out.push({ tone: "blue", text: `${stale.length} topic${stale.length > 1 ? "s" : ""} not revised for 2+ weeks.` });
    const issues = plan.topics.filter((t) => t.issue).length;
    if (issues) out.push({ tone: "amber", text: `${issues} topic${issues > 1 ? "s need" : " needs"} fixing before it can be planned.`, href: "#/topics" });
    return out;
  }, [plan, data.logs, today, high]);

  const shortfall = plan.totals.shortfall;
  const buffer = Math.max(0, plan.totals.capacity - plan.totals.scheduled);

  const sessionRow = (s: Session, i: number) => {
    const sub = subj(s.subjectId);
    const t = topic(s.topicId);
    const m = tm(s.topicId);
    const label = s.kind === "pastpaper" ? "Past paper" : s.kind === "buffer" ? "Buffer" : m?.label ?? "Low";
    const name = s.kind === "pastpaper" ? "Past-paper practice (timed)" : s.kind === "buffer" ? "Review weakest topics or an extra past paper" : t?.name;
    return (
      <li key={s.index} className={`bg-white rounded-2xl px-3.5 py-3 flex items-center gap-3 ${i === 0 ? "border-2 border-[#2563EB]" : "border border-[#E2E8F0]"}`}>
        <div className="flex-1 min-w-0 flex flex-col gap-1">
          <div className="flex items-center gap-1.5">
            {sub && <Dot color={sub.color} />}
            <span className="text-xs font-semibold text-[#475569]">
              {sub?.name} · {fmtH(plan.sessionLen)}
            </span>
          </div>
          {t ? (
            <a href={`#/topic/${t.id}`} className="text-base font-bold text-[#0F172A] no-underline truncate">
              {name}
            </a>
          ) : (
            <span className="text-base font-bold">{name}</span>
          )}
          <div>
            <Badge label={label} />
          </div>
        </div>
        <button
          onClick={() => setLogging({ subjectId: s.subjectId, topicId: s.topicId, kind: s.kind })}
          className={`h-10 px-4 rounded-[10px] font-bold text-sm ${i === 0 ? "bg-[#2563EB] text-white" : "border border-[#CBD5E1] text-[#0F172A]"}`}
        >
          Done
        </button>
      </li>
    );
  };

  return (
    <>
      <header className="pt-6 pb-3 flex justify-between items-start">
        <div className="flex flex-col gap-1">
          <span className="text-[13px] font-semibold text-[#475569]">{fmtLong(today)}</span>
          <h1 className="m-0 text-[26px] lg:text-[32px] font-extrabold tracking-tight">
            {greet}
            {data.name ? `, ${data.name}` : ""}
          </h1>
        </div>
        <a href="#/settings" aria-label="Settings" className="lg:hidden w-11 h-11 -mr-2.5 flex items-center justify-center text-[#334155]">
          {Icon.gear()}
        </a>
      </header>

      <div className="flex flex-col gap-3.5">
        {/* laptop stat cards */}
        <div className="hidden lg:grid grid-cols-4 gap-3">
          {[
            { l: "NEXT EXAM", v: plan.nextExam ? `${plan.nextExam.days} days` : "—", s: plan.nextExam ? `${plan.nextExam.subject.name} · ${fmtShort(plan.nextExam.date)}` : "Add an exam", c: "#B45309" },
            { l: "TOPICS MASTERED", v: `${plan.totals.mastered} / ${plan.totals.topics}`, s: `${plan.totals.topics ? Math.round((plan.totals.mastered / plan.totals.topics) * 100) : 0}% complete`, c: "#15803D" },
            { l: "HOURS STILL NEEDED", v: fmtH(plan.totals.workload), s: `${fmtH(plan.totals.capacity)} available before last exam`, c: "#1E3A8A" },
            { l: "STUDY STREAK", v: `${streak} day${streak === 1 ? "" : "s"}`, s: `${fmtH(week)} of ${fmtH(weekTarget)} this week`, c: "#1E3A8A" },
          ].map((k) => (
            <Card key={k.l} className="p-4 flex flex-col gap-1">
              <span className="text-[11px] font-extrabold text-[#475569] tracking-wide">{k.l}</span>
              <span className="text-[28px] font-extrabold" style={{ color: k.c }}>
                {k.v}
              </span>
              <span className="text-xs text-[#475569]">{k.s}</span>
            </Card>
          ))}
        </div>

        {/* phone countdown chips */}
        <section aria-label="Exam countdown" className="flex gap-2 lg:hidden overflow-x-auto">
          {exams.map((s) => (
            <div key={s.subject.id} className={`flex-1 min-w-[96px] rounded-xl px-3 py-2.5 flex flex-col gap-0.5 ${s.daysLeft! <= 21 ? "bg-[#FEF3C7]" : "bg-[#DBEAFE]"}`}>
              <span className={`text-[22px] font-extrabold ${s.daysLeft! <= 7 ? "text-[#B91C1C]" : s.daysLeft! <= 21 ? "text-[#B45309]" : "text-[#1E3A8A]"}`}>
                {s.daysLeft}
                <span className="text-xs font-bold"> days</span>
              </span>
              <span className="text-xs font-semibold text-[#334155] truncate">{s.subject.name}</span>
            </div>
          ))}
        </section>

        {plan.totals.workload > 0 &&
          (shortfall > 0 ? (
            <div role="status" className="bg-[#FEE2E2] text-[#7F1D1D] rounded-xl px-3 py-2.5 text-[13px] font-semibold flex gap-2 items-start">
              <span className="text-[#DC2626] mt-0.5">{Icon.alert()}</span>
              <span>
                Not enough time: {fmtH(shortfall)} of revision won't fit before your exams. Your plan covers the highest-priority topics first.
              </span>
            </div>
          ) : (
            <div role="status" className="bg-[#DCFCE7] text-[#14532D] rounded-xl px-3 py-2.5 text-[13px] font-semibold flex gap-2 items-center">
              {Icon.check()} On track: everything fits{buffer > 0 ? `, with ${fmtH(buffer)} to spare` : ""}.
            </div>
          ))}

        <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr] items-start">
          <section className="flex flex-col gap-2">
            <div className="flex justify-between items-baseline">
              <h2 className="m-0 text-[17px] font-extrabold">Today's plan</h2>
              <span className="text-[13px] text-[#475569] font-semibold">
                {doneToday.length} of {totalToday} done{todays.length ? ` · ${fmtH(todays.length * plan.sessionLen)} left` : ""}
              </span>
            </div>
            <ul className="list-none m-0 p-0 flex flex-col gap-2">
              {doneToday.map((l) => {
                const sub = subj(l.subjectId);
                const t = topic(l.topicId);
                return (
                  <li key={l.id} className="opacity-60 bg-white border border-[#E2E8F0] rounded-2xl px-3.5 py-3 flex items-center gap-3">
                    <div className="flex-1 min-w-0 flex flex-col gap-1">
                      <div className="flex items-center gap-1.5">
                        {sub && <Dot color={sub.color} />}
                        <span className="text-xs font-semibold text-[#475569]">
                          {sub?.name} · {fmtH(l.hours)}
                        </span>
                      </div>
                      <span className="text-base font-bold truncate">{t?.name ?? (l.type === "pastpaper" ? "Past paper" : "Study session")}</span>
                    </div>
                    <span className="flex items-center gap-1 text-[#15803D] font-bold text-[13px]">{Icon.check()} Done</span>
                  </li>
                );
              })}
              {todays.map(sessionRow)}
            </ul>
            {totalToday === 0 && (
              <Card className="p-4 text-sm text-[#475569]">
                {plan.totals.workload === 0 && plan.totals.topics > 0
                  ? "Everything is planned and covered. Nice work!"
                  : "No sessions today: it's a day off, an exam day, or there's no time set for today. Enjoy the break!"}
              </Card>
            )}
            <button onClick={() => setLogging("free")} className="self-start text-sm font-semibold text-[#1D4ED8] min-h-11">
              + Log something else you studied
            </button>
          </section>

          <aside className="flex flex-col gap-3">
            <Card className="p-4 hidden lg:flex flex-col gap-3">
              <h2 className="m-0 text-[17px] font-extrabold">Exam countdown</h2>
              {exams.map((s) => (
                <div key={s.subject.id} className="flex flex-col gap-1.5">
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-2 font-bold text-sm">
                      <Dot color={s.subject.color} />
                      {s.subject.name}
                      <span className="font-medium text-[#475569] text-xs">{fmtShort(s.subject.examDate)}</span>
                    </span>
                    <span className={`font-extrabold ${s.daysLeft! <= 21 ? "text-[#B45309]" : "text-[#1E3A8A]"}`}>{s.daysLeft} days</span>
                  </div>
                  <Bar pct={s.topicsTotal ? (s.topicsMastered / s.topicsTotal) * 100 : 0} color="#16A34A" />
                </div>
              ))}
            </Card>
            {alerts.map((a, i) => {
              const cls = a.tone === "red" ? "border-[#FECACA] text-[#7F1D1D]" : a.tone === "amber" ? "border-[#FDE68A] text-[#78350F]" : "border-[#BFDBFE] text-[#1E3A8A]";
              const inner = (
                <>
                  <span className={a.tone === "red" ? "text-[#DC2626]" : a.tone === "amber" ? "text-[#D97706]" : "text-[#2563EB]"}>{Icon.alert()}</span>
                  <span>{a.text}</span>
                </>
              );
              return a.href ? (
                <a key={i} href={a.href} className={`bg-white border rounded-xl px-3 py-2.5 text-[13px] no-underline flex gap-2 items-start ${cls}`}>
                  {inner}
                </a>
              ) : (
                <div key={i} className={`bg-white border rounded-xl px-3 py-2.5 text-[13px] flex gap-2 items-start ${cls}`}>
                  {inner}
                </div>
              );
            })}
            <UpNext />
          </aside>
        </div>
      </div>
      <LogSheet preset={logging} onClose={() => setLogging(null)} />
    </>
  );

  function UpNext() {
    const tomorrow = addDays(today, 1);
    const ss = plan.sessions.filter((s) => s.date === tomorrow);
    if (!ss.length) return null;
    return (
      <Card className="p-4 flex flex-col gap-2">
        <h2 className="m-0 text-sm font-extrabold">Tomorrow</h2>
        {ss.map((s) => (
          <div key={s.index} className="flex items-center gap-2 text-sm">
            <Dot color={subj(s.subjectId)?.color ?? "#999"} />
            <span className="truncate">{s.kind === "revision" ? topic(s.topicId)?.name : s.kind === "pastpaper" ? "Past paper" : "Buffer / review"}</span>
            <span className="ml-auto text-xs text-[#475569]">{subj(s.subjectId)?.name}</span>
          </div>
        ))}
      </Card>
    );
  }
}
