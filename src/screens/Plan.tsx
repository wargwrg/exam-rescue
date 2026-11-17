import { useState } from "react";
import { useStore } from "../lib/store";
import { addDays, dayNum, dayShort, fmtLong, fmtShort, weekStart } from "../lib/dates";
import { Badge, Card, Dot, Icon, PageHeader, fmtH } from "../components/ui";

export function PlanScreen() {
  const { data, plan, today } = useStore();
  const [offset, setOffset] = useState(0);
  const [sel, setSel] = useState(today);
  const start = addDays(weekStart(today), offset * 7);
  const week = Array.from({ length: 7 }, (_, i) => addDays(start, i));
  const byDate = (d: string) => plan.sessions.filter((s) => s.date === d);
  const subj = (id: string) => data.subjects.find((s) => s.id === id);
  const examOn = (d: string) => data.subjects.filter((s) => s.examDate === d);
  const day = byDate(sel);
  const heatDays = Array.from({ length: 14 }, (_, i) => addDays(today, i));
  const openSubs = plan.subjects.filter((s) => s.open);

  return (
    <>
      <PageHeader
        eyebrow={`Week of ${fmtShort(start)}`}
        title="Your plan"
        right={<span className="text-xs font-semibold text-[#475569] text-right">{plan.sessions.filter((s) => s.kind !== "buffer").length} sessions to last exam</span>}
      />
      <div className="flex flex-col gap-4">
        {plan.totals.shortfall > 0 && (
          <div className="bg-[#FEE2E2] text-[#7F1D1D] rounded-xl px-3 py-2.5 text-[13px] font-semibold flex gap-2">
            <span className="text-[#DC2626]">{Icon.alert()}</span>
            <span>
              {fmtH(plan.totals.shortfall)} of revision won't fit.{" "}
              {plan.subjects
                .filter((s) => s.shortfall > 0)
                .map((s) => `${s.subject.name}: ${fmtH(s.shortfall)} short`)
                .join(" · ")}
              . Lowest-priority topics are left out first. Add time in Settings → Study time.
            </span>
          </div>
        )}

        <div className="flex items-center gap-1.5">
          <button aria-label="Previous week" disabled={offset <= 0} onClick={() => setOffset(offset - 1)} className="w-9 h-[72px] flex items-center justify-center text-[#334155] disabled:opacity-30">
            {Icon.back(20)}
          </button>
          <div role="group" aria-label="Pick a day" className="flex-1 grid grid-cols-7 gap-1.5">
            {week.map((d) => {
              const on = d === sel;
              const n = byDate(d);
              const past = d < today;
              const exam = examOn(d).length > 0;
              return (
                <button
                  key={d}
                  aria-pressed={on}
                  onClick={() => setSel(d)}
                  className={`h-[72px] rounded-xl border flex flex-col items-center justify-center gap-1 ${
                    on ? "bg-[#14213D] border-[#14213D] text-white" : exam ? "bg-[#FEE2E2] border-[#FECACA]" : "bg-white border-[#E2E8F0]"
                  } ${past && !on ? "opacity-50" : ""}`}
                >
                  <span className="text-[11px] font-semibold">{dayShort(d)}</span>
                  <span className="text-[17px] font-extrabold">{dayNum(d)}</span>
                  <span aria-hidden="true" className="flex gap-0.5 h-1.5">
                    {n.slice(0, 5).map((s) => (
                      <span key={s.index} className="w-1.5 h-1.5 rounded-full" style={{ background: on ? "#fff" : subj(s.subjectId)?.color }} />
                    ))}
                  </span>
                </button>
              );
            })}
          </div>
          <button aria-label="Next week" onClick={() => setOffset(offset + 1)} className="w-9 h-[72px] flex items-center justify-center text-[#334155]">
            {Icon.chevron(20)}
          </button>
        </div>

        <div className="grid gap-4 lg:grid-cols-2 items-start">
          <section className="flex flex-col gap-2">
            <div className="flex justify-between items-baseline">
              <h2 className="m-0 text-[17px] font-extrabold">{fmtLong(sel)}</h2>
              <span className="text-[13px] text-[#475569] font-semibold">
                {day.length} session{day.length === 1 ? "" : "s"} · {fmtH(day.length * plan.sessionLen)}
              </span>
            </div>
            {examOn(sel).map((s) => (
              <div key={s.id} className="bg-[#FEE2E2] text-[#7F1D1D] rounded-xl px-3 py-2.5 text-sm font-bold">
                Exam day: {s.name}. Good luck!
              </div>
            ))}
            {sel === today && data.logs.some((l) => l.date === today) && (
              <p className="m-0 text-xs text-[#475569]">Showing what's left today, after the sessions you've already logged.</p>
            )}
            {sel < today ? (
              <Card className="p-4 text-sm text-[#475569]">This day has passed. Your plan always starts from today.</Card>
            ) : day.length === 0 ? (
              <Card className="p-4 text-sm text-[#475569]">No sessions planned for this day.</Card>
            ) : (
              <ul className="list-none m-0 p-0 flex flex-col gap-2">
                {day.map((s, i) => {
                  const sub = subj(s.subjectId);
                  const t = data.topics.find((x) => x.id === s.topicId);
                  const m = plan.topics.find((x) => x.topic.id === s.topicId);
                  return (
                    <li key={s.index} className="bg-white border border-[#E2E8F0] rounded-xl px-3.5 py-3 flex items-center gap-3">
                      <span className="text-[13px] font-bold text-[#475569] w-5">{i + 1}</span>
                      <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                        <span className="flex items-center gap-1.5 text-xs font-semibold text-[#475569]">
                          {sub && <Dot color={sub.color} />}
                          {sub?.name}
                        </span>
                        {t ? (
                          <a href={`#/topic/${t.id}`} className="text-[15px] font-bold text-[#0F172A] no-underline truncate">
                            {t.name}
                          </a>
                        ) : (
                          <span className="text-[15px] font-bold">{s.kind === "pastpaper" ? "Past-paper practice (timed)" : "Review weakest topics / extra past paper"}</span>
                        )}
                      </div>
                      <Badge label={s.kind === "pastpaper" ? "Past paper" : s.kind === "buffer" ? "Buffer" : m?.label ?? "Low"} />
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <Card className="p-4 flex flex-col gap-2.5">
            <div className="flex justify-between items-baseline">
              <h2 className="m-0 text-[15px] font-extrabold">Next 2 weeks</h2>
              <span className="text-[11px] text-[#475569]">darker = more hours</span>
            </div>
            <div className="overflow-x-auto">
              <div className="grid gap-[3px] items-center min-w-[320px]" style={{ gridTemplateColumns: "56px repeat(14, minmax(0, 1fr))" }}>
                {openSubs.map((s) => (
                  <Row key={s.subject.id} name={s.subject.name} color={s.subject.color} vals={heatDays.map((d) => byDate(d).filter((x) => x.subjectId === s.subject.id && x.kind !== "buffer").length * plan.sessionLen)} />
                ))}
                <span />
                {heatDays.map((d) => (
                  <span key={d} className={`text-[9px] text-center ${examOn(d).length ? "text-[#DC2626] font-bold" : "text-[#64748B]"}`}>
                    {dayShort(d)[0]}
                  </span>
                ))}
              </div>
            </div>
            <p className="m-0 text-xs leading-relaxed text-[#475569]">
              Subjects with closer exams get more time as the date approaches. The last days before an exam focus on that subject and past papers. Missed a session? The plan moves it to the days you have left.
            </p>
          </Card>
        </div>
      </div>
    </>
  );
}

function Row({ name, color, vals }: { name: string; color: string; vals: number[] }) {
  return (
    <>
      <span className="text-[11px] font-bold text-[#334155] truncate">{name}</span>
      {vals.map((v, i) => (
        <div key={i} title={v ? `${v}h` : "—"} className="h-[22px] rounded" style={{ background: v === 0 ? "#F1F5F9" : color + (v >= 3 ? "FF" : v >= 2 ? "BB" : v >= 1 ? "77" : "44") }} />
      ))}
    </>
  );
}
