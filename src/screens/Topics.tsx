import { useMemo, useState } from "react";
import { useStore } from "../lib/store";
import { go } from "../lib/router";
import { uid } from "../lib/demo";
import { Badge, Bar, Dot, Icon, Label, PageHeader, PrimaryButton, Segmented, Sheet, Stepper, inputCls } from "../components/ui";
import { StepHeader } from "./SetupExams";
import type { TopicMetrics } from "../lib/engine";

const RATINGS = [1, 2, 3, 4, 5].map((v) => ({ value: v, label: String(v) }));

export function Topics({ setup = false }: { setup?: boolean }) {
  const { data, plan, update } = useStore();
  const [filter, setFilter] = useState<string>("all");
  const [q, setQ] = useState("");
  const [adding, setAdding] = useState(false);

  const groups = useMemo(() => {
    return data.subjects
      .filter((s) => filter === "all" || filter === "High" || filter === s.id)
      .map((s) => ({
        subject: s,
        days: plan.subjects.find((x) => x.subject.id === s.id)?.daysLeft ?? null,
        items: plan.topics
          .filter((t) => t.topic.subjectId === s.id)
          .filter((t) => filter !== "High" || t.label === "High")
          .filter((t) => !q || t.topic.name.toLowerCase().includes(q.toLowerCase()))
          .sort((a, b) => Number(a.topic.mastered) - Number(b.topic.mastered) || b.score - a.score),
      }))
      .filter((g) => g.items.length || (filter === g.subject.id && !q));
  }, [data.subjects, plan, filter, q]);

  const chips = [{ id: "all", label: "All" }, { id: "High", label: "High priority" }, ...data.subjects.map((s) => ({ id: s.id, label: s.name }))];

  return (
    <div className={setup ? "flex flex-col min-h-screen" : ""}>
      {setup ? (
        <div className="mb-3">
          <StepHeader
            step={3}
            title="What do you need to revise?"
            sub="Add your topics and rate how confident you feel. Smaller topics (e.g. “Differentiation” rather than “Calculus”) give a better plan."
            back={() => go("setup/time")}
          />
        </div>
      ) : (
        <PageHeader
          eyebrow={`${plan.totals.topics} topics · ${plan.totals.mastered} mastered`}
          title="Topics"
          right={
            <button onClick={() => setAdding(true)} className="h-11 px-3.5 rounded-xl bg-[#2563EB] text-white font-bold text-sm flex items-center gap-1.5">
              {Icon.plus()} Add
            </button>
          }
        />
      )}

      <div className="flex flex-col gap-2.5">
        <label className="h-11 rounded-xl bg-white border border-[#E2E8F0] flex items-center gap-2 px-3 text-[#64748B]">
          {Icon.search()}
          <input aria-label="Search topics" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search topics" className="border-0 outline-none flex-1 text-[15px] bg-transparent text-[#0F172A]" />
        </label>
        <div role="group" aria-label="Filter" className="flex gap-1.5 overflow-x-auto pb-1">
          {chips.map((c) => (
            <button
              key={c.id}
              aria-pressed={filter === c.id}
              onClick={() => setFilter(c.id)}
              className={`h-9 px-3.5 rounded-full text-[13px] font-semibold whitespace-nowrap shrink-0 border ${filter === c.id ? "bg-[#14213D] border-[#14213D] text-white" : "bg-white border-[#CBD5E1] text-[#0F172A]"}`}
            >
              {c.label}
            </button>
          ))}
        </div>

        {data.subjects.length === 0 && <p className="text-sm text-[#475569]">Add a subject first.</p>}

        <div className="grid gap-4 lg:grid-cols-2 items-start">
          {groups.map((g) => (
            <section key={g.subject.id} className="flex flex-col gap-1.5">
              <h2 className="m-0 text-[13px] font-extrabold text-[#334155] flex items-center gap-1.5">
                <Dot color={g.subject.color} />
                {g.subject.name}
                <span className="font-semibold text-[#475569]">{g.days !== null && g.days > 0 ? `· exam in ${g.days} days` : "· no upcoming exam"}</span>
              </h2>
              {g.items.length === 0 ? (
                <p className="text-sm text-[#475569] bg-white border border-dashed border-[#CBD5E1] rounded-2xl p-4">No topics yet.</p>
              ) : (
                <ul className="list-none m-0 p-0 bg-white border border-[#E2E8F0] rounded-2xl">
                  {g.items.map((t, i) => (
                    <TopicRow key={t.topic.id} t={t} first={i === 0} />
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>
        {!setup && <p className="text-xs text-[#475569]">Dots = your confidence (1–5). Bar = hours studied vs planned.</p>}
      </div>

      {setup && (
        <div className="mt-auto pt-6 flex flex-col gap-3">
          <button onClick={() => setAdding(true)} className="h-12 rounded-xl border border-dashed border-[#94A3B8] bg-white text-[#1D4ED8] font-bold flex items-center justify-center gap-1.5">
            {Icon.plus()} Add a topic
          </button>
          <PrimaryButton
            disabled={!data.topics.length}
            onClick={() => {
              update((d) => void (d.setupDone = true));
              go("today");
            }}
          >
            Build my plan
          </PrimaryButton>
          {!data.topics.length && <p className="text-xs text-center text-[#475569] m-0">Add at least one topic to build your plan.</p>}
        </div>
      )}
      <AddTopicSheet open={adding} onClose={() => setAdding(false)} defaultSubject={data.subjects.find((s) => s.id === filter)?.id} />
    </div>
  );
}

function TopicRow({ t, first }: { t: TopicMetrics; first: boolean }) {
  const pct = t.topic.mastered ? 100 : t.plannedHours ? (t.hoursDone / t.plannedHours) * 100 : 0;
  return (
    <li className={first ? "" : "border-t border-[#F1F5F9]"}>
      <a href={`#/topic/${t.topic.id}`} className="flex flex-col gap-1.5 px-3.5 py-3 no-underline text-[#0F172A] min-h-11 hover:bg-[#F8FAFC] rounded-2xl">
        <div className="flex justify-between gap-2 items-center">
          <span className="text-[15px] font-bold truncate">{t.topic.name || "Untitled topic"}</span>
          <Badge label={t.label} />
        </div>
        <div className="flex items-center gap-2.5">
          <span aria-label={`Confidence ${t.topic.confidence} of 5`} className="flex gap-0.5">
            {[0, 1, 2, 3, 4].map((i) => (
              <span key={i} className={`w-1.5 h-1.5 rounded-full ${i < t.topic.confidence ? "bg-[#0F172A]" : "bg-[#CBD5E1]"}`} />
            ))}
          </span>
          <div className="flex-1">
            <Bar pct={pct} color={t.topic.mastered ? "#16A34A" : "#2563EB"} h={5} />
          </div>
          <span className="text-[11px] text-[#475569] font-semibold whitespace-nowrap">
            {Math.round(t.hoursDone * 10) / 10} / {Math.round(t.plannedHours * 10) / 10}h
          </span>
        </div>
        {(t.issue || t.wontFit) && (
          <span className="text-xs font-semibold text-[#B45309] flex items-center gap-1">
            {Icon.alert(14)} {t.issue ?? "Not enough time before the exam"}
          </span>
        )}
      </a>
    </li>
  );
}

export function AddTopicSheet({ open, onClose, defaultSubject }: { open: boolean; onClose: () => void; defaultSubject?: string }) {
  const { data, update } = useStore();
  const [subjectId, setSubjectId] = useState("");
  const [name, setName] = useState("");
  const [conf, setConf] = useState(3);
  const [imp, setImp] = useState(3);
  const [hours, setHours] = useState(3);
  const [msg, setMsg] = useState<string | null>(null);
  const sid = subjectId || defaultSubject || data.subjects[0]?.id || "";

  const save = (again: boolean) => {
    if (!sid) return setMsg("Add a subject first.");
    if (!name.trim()) return setMsg("Type the topic name.");
    if (data.topics.some((t) => t.subjectId === sid && t.name.trim().toLowerCase() === name.trim().toLowerCase())) return setMsg("That topic already exists in this subject.");
    update((d) => {
      d.topics.push({ id: uid(), subjectId: sid, name: name.trim(), confidence: conf, importance: imp, estHours: hours, mastered: false, notes: "" });
    });
    setName("");
    setMsg(again ? `Added “${name.trim()}”. Add the next one.` : null);
    if (!again) onClose();
  };

  return (
    <Sheet open={open} onClose={onClose} title="Add a topic">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="tsub">Subject</Label>
          <select id="tsub" value={sid} onChange={(e) => setSubjectId(e.target.value)} className={inputCls}>
            {data.subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="tname">Topic</Label>
          <input id="tname" autoFocus value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && save(true)} placeholder="e.g. Differentiation" className={inputCls} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Confidence (1 = very weak)</Label>
          <Segmented label="Confidence" options={RATINGS} value={conf} onChange={setConf} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Importance (5 = comes up a lot)</Label>
          <Segmented label="Importance" options={RATINGS} value={imp} onChange={setImp} />
        </div>
        <div className="flex items-center justify-between">
          <Label>Hours you think it needs</Label>
          <Stepper label="hours" value={hours} onChange={setHours} min={0.5} max={40} />
        </div>
        {msg && (
          <p role="status" className="m-0 text-sm text-[#1D4ED8]">
            {msg}
          </p>
        )}
        <div className="grid grid-cols-2 gap-2">
          <button onClick={() => save(true)} className="h-12 rounded-xl border border-[#CBD5E1] font-bold text-[15px]">
            Save & add another
          </button>
          <button onClick={() => save(false)} className="h-12 rounded-xl bg-[#2563EB] text-white font-bold text-[15px]">
            Save
          </button>
        </div>
      </div>
    </Sheet>
  );
}
