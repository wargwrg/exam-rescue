import { useState } from "react";
import { useStore } from "../lib/store";
import { uid } from "../lib/demo";
import { fmtShort } from "../lib/dates";
import { hoursThisWeek, studyStreak } from "../lib/engine";
import { Bar, Card, Dot, Icon, Label, PageHeader, Sheet, fmtH, inputCls } from "../components/ui";

export function Progress() {
  const { data, plan, today, update } = useStore();
  const [adding, setAdding] = useState(false);
  const pct = plan.totals.topics ? plan.totals.mastered / plan.totals.topics : 0;
  const streak = studyStreak(data, today);
  const week = hoursThisWeek(data, today);
  const target = data.weekly.reduce((a, b) => a + b, 0);
  const subj = (id: string) => data.subjects.find((s) => s.id === id);
  const papers = [...data.pastPapers].sort((a, b) => b.date.localeCompare(a.date));
  const trends = data.subjects
    .map((s) => {
      const ps = data.pastPapers.filter((p) => p.subjectId === s.id && p.total > 0).sort((a, b) => a.date.localeCompare(b.date));
      if (!ps.length) return null;
      const first = ps[0].marks / ps[0].total;
      const last = ps[ps.length - 1].marks / ps[ps.length - 1].total;
      return { s, n: ps.length, first, last, change: last - first };
    })
    .filter(Boolean) as { s: (typeof data.subjects)[number]; n: number; first: number; last: number; change: number }[];
  const msg =
    pct >= 1 ? "Every topic mastered. Brilliant work!" : pct >= 0.75 ? "Final stretch: 75%+ mastered." : pct >= 0.5 ? "Halfway there. Keep the momentum." : pct >= 0.25 ? "Great start: a quarter mastered." : streak >= 3 ? `${streak}-day streak. Keep it going!` : "One session at a time. Start with today's plan.";

  return (
    <>
      <PageHeader eyebrow={msg} title="Progress" />
      <div className="grid gap-4 lg:grid-cols-2 items-start">
        <div className="flex flex-col gap-3.5">
          <section className="bg-[#14213D] text-white rounded-2xl p-4 flex items-center gap-4">
            <svg width="84" height="84" viewBox="0 0 36 36" role="img" aria-label={`${Math.round(pct * 100)} percent of topics mastered`}>
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="#1E3A8A" strokeWidth="4" />
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="#22C55E" strokeWidth="4" strokeDasharray={`${pct * 100} ${100 - pct * 100}`} strokeDashoffset="25" strokeLinecap="round" />
              <text x="18" y="21" textAnchor="middle" fontSize="9" fontWeight="800" fill="#fff">
                {Math.round(pct * 100)}%
              </text>
            </svg>
            <div className="flex flex-col gap-1">
              <span className="text-lg font-extrabold">
                {plan.totals.mastered} of {plan.totals.topics} topics mastered
              </span>
              <span className="text-[13px] text-[#CBD5E1]">
                {fmtH(plan.totals.workload)} of revision left · {fmtH(plan.totals.capacity)} available
              </span>
            </div>
          </section>
          <div className="grid grid-cols-3 gap-2">
            {[
              [fmtH(plan.totals.hoursLogged), "studied"],
              [`${streak} day${streak === 1 ? "" : "s"}`, "streak"],
              [`${fmtH(week)} / ${fmtH(target)}`, "this week"],
            ].map(([v, l]) => (
              <Card key={l} className="px-3 py-2.5 flex flex-col gap-0.5">
                <span className="text-[17px] font-extrabold">{v}</span>
                <span className="text-[11px] font-semibold text-[#475569]">{l}</span>
              </Card>
            ))}
          </div>
          {target > 0 && week >= target && <p className="m-0 text-sm font-bold text-[#15803D]">Weekly target hit. Great consistency!</p>}
          <Card className="p-4 flex flex-col gap-2.5">
            <h2 className="m-0 text-[15px] font-extrabold">By subject</h2>
            {plan.subjects.map((s) => (
              <div key={s.subject.id} className="flex flex-col gap-1">
                <div className="flex justify-between text-[13px]">
                  <span className="flex items-center gap-1.5 font-bold">
                    <Dot color={s.subject.color} />
                    {s.subject.name}
                  </span>
                  <span className="text-[#475569] font-semibold">
                    {s.topicsMastered} of {s.topicsTotal} mastered
                  </span>
                </div>
                <Bar pct={s.topicsTotal ? (s.topicsMastered / s.topicsTotal) * 100 : 0} color="#16A34A" h={8} />
              </div>
            ))}
          </Card>
        </div>

        <Card className="p-4 flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <h2 className="m-0 text-[15px] font-extrabold">Past papers</h2>
            <button onClick={() => setAdding(true)} className="h-9 px-3 rounded-[10px] border border-[#CBD5E1] font-bold text-[13px] text-[#1D4ED8]">
              + Add result
            </button>
          </div>
          {trends.length === 0 && <p className="m-0 text-sm text-[#475569]">Add your practice paper scores to track improvement. Topics you lost marks on get pushed up your plan.</p>}
          {trends.map((t) => (
            <div key={t.s.id} className="flex items-center gap-2 text-sm">
              <Dot color={t.s.color} />
              <span className="font-bold">{t.s.name}</span>
              <span className="text-[#475569]">
                {Math.round(t.first * 100)}% → {Math.round(t.last * 100)}%
              </span>
              <span className={`ml-auto font-bold ${t.n < 2 ? "text-[#475569]" : t.change > 0 ? "text-[#15803D]" : t.change < 0 ? "text-[#B91C1C]" : "text-[#475569]"}`}>
                {t.n < 2 ? "1 paper" : t.change > 0 ? `▲ ${Math.round(t.change * 100)} pts` : t.change < 0 ? `▼ ${Math.round(-t.change * 100)} pts` : "► steady"}
              </span>
            </div>
          ))}
          <ul className="list-none m-0 p-0 flex flex-col">
            {papers.map((p, i) => (
              <li key={p.id} className={`flex items-center gap-2 py-2.5 ${i ? "border-t border-[#F1F5F9]" : ""}`}>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold truncate">
                    {subj(p.subjectId)?.name} · {p.name || "Paper"}
                  </div>
                  <div className="text-xs text-[#475569] truncate">
                    {fmtShort(p.date)}
                    {p.weakTopicIds.length ? ` · weak: ${p.weakTopicIds.map((id) => data.topics.find((t) => t.id === id)?.name).filter(Boolean).join(", ")}` : ""}
                  </div>
                </div>
                <span className={`font-extrabold ${p.marks / p.total >= 0.7 ? "text-[#15803D]" : p.marks / p.total < 0.5 ? "text-[#B91C1C]" : ""}`}>{Math.round((p.marks / p.total) * 100)}%</span>
                <button aria-label="Delete result" onClick={() => update((d) => void (d.pastPapers = d.pastPapers.filter((x) => x.id !== p.id)))} className="w-9 h-9 flex items-center justify-center text-[#94A3B8]">
                  {Icon.trash(16)}
                </button>
              </li>
            ))}
          </ul>
        </Card>
      </div>
      <PaperSheet open={adding} onClose={() => setAdding(false)} />
    </>
  );
}

function PaperSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { data, today, update } = useStore();
  const [subjectId, setSubjectId] = useState("");
  const [name, setName] = useState("");
  const [date, setDate] = useState(today);
  const [marks, setMarks] = useState("");
  const [total, setTotal] = useState("");
  const [weak, setWeak] = useState<string[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const sid = subjectId || data.subjects[0]?.id || "";
  const save = () => {
    const m = Number(marks);
    const t = Number(total);
    if (!sid) return setErr("Add a subject first.");
    if (!(t > 0) || !(m >= 0) || m > t) return setErr("Enter your marks and the total (marks can't be more than the total).");
    update((d) => void d.pastPapers.push({ id: uid(), subjectId: sid, name: name.trim(), date, marks: m, total: t, weakTopicIds: weak }));
    setName("");
    setMarks("");
    setTotal("");
    setWeak([]);
    setErr(null);
    onClose();
  };
  return (
    <Sheet open={open} onClose={onClose} title="Add a past-paper result">
      <div className="flex flex-col gap-3.5">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="pps">Subject</Label>
          <select id="pps" className={inputCls} value={sid} onChange={(e) => (setSubjectId(e.target.value), setWeak([]))}>
            {data.subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ppn">Paper / year</Label>
            <input id="ppn" className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="2024 Paper 1" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ppd">Date</Label>
            <input id="ppd" type="date" className={inputCls} value={date} max={today} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ppm">Marks</Label>
            <input id="ppm" inputMode="decimal" className={inputCls} value={marks} onChange={(e) => setMarks(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ppt">Out of</Label>
            <input id="ppt" inputMode="decimal" className={inputCls} value={total} onChange={(e) => setTotal(e.target.value)} />
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Topics where you lost marks</Label>
          <div className="flex flex-wrap gap-1.5">
            {data.topics
              .filter((t) => t.subjectId === sid)
              .map((t) => {
                const on = weak.includes(t.id);
                return (
                  <button
                    key={t.id}
                    aria-pressed={on}
                    onClick={() => setWeak(on ? weak.filter((x) => x !== t.id) : [...weak, t.id])}
                    className={`min-h-9 px-3 rounded-full text-[13px] font-semibold border ${on ? "bg-[#DC2626] border-[#DC2626] text-white" : "bg-white border-[#CBD5E1]"}`}
                  >
                    {t.name}
                  </button>
                );
              })}
          </div>
          <span className="text-xs text-[#475569]">These topics move up your plan for the next {data.settings.ppLookback} days.</span>
        </div>
        {err && (
          <p role="alert" className="m-0 text-sm text-[#B91C1C]">
            {err}
          </p>
        )}
        <button onClick={save} className="h-[54px] rounded-2xl bg-[#2563EB] text-white font-bold">
          Save result
        </button>
      </div>
    </Sheet>
  );
}
