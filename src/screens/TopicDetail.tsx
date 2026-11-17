import { useStore } from "../lib/store";
import { go } from "../lib/router";
import { fmtLong } from "../lib/dates";
import { askConfirm } from "../components/Confirm";
import { Badge, BackHeader, Card, Dot, Icon, Label, Segmented, Stepper, Toggle, fmtH, inputCls } from "../components/ui";

const RATINGS = [1, 2, 3, 4, 5].map((v) => ({ value: v, label: String(v) }));

export function TopicDetail({ id }: { id: string }) {
  const { data, plan, update } = useStore();
  const tm = plan.topics.find((t) => t.topic.id === id);
  if (!tm) {
    return (
      <div className="py-10">
        <p>This topic no longer exists.</p>
        <a href="#/topics">Back to topics</a>
      </div>
    );
  }
  const t = tm.topic;
  const sub = tm.subject;
  const set = (fn: (x: typeof t) => void) => update((d) => fn(d.topics.find((x) => x.id === id)!));
  const parts = [
    { l: "Weak topic", v: tm.scoreParts.weakness, max: 100 * data.settings.wWeak },
    { l: "Important", v: tm.scoreParts.importance, max: 100 * data.settings.wImp },
    { l: "Exam soon", v: tm.scoreParts.urgency, max: 100 * data.settings.wUrg },
    { l: "Past papers", v: tm.scoreParts.pastPapers, max: data.settings.ppCap },
  ];
  const next = plan.sessions.filter((s) => s.topicId === id);

  return (
    <div className="max-w-[640px]">
      <BackHeader onBack={() => history.back()}>
        {sub && <Dot color={sub.color} />}
        <span className="text-[13px] font-semibold text-[#475569]">
          {sub?.name}
          {tm.daysToExam !== null && tm.daysToExam > 0 ? ` · exam in ${tm.daysToExam} days` : ""}
        </span>
      </BackHeader>
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center gap-3">
          <input
            aria-label="Topic name"
            value={t.name}
            onChange={(e) => set((x) => void (x.name = e.target.value))}
            className="text-[26px] font-extrabold tracking-tight bg-transparent border-0 p-0 min-w-0 flex-1 focus:outline-none focus:underline"
          />
          <Badge label={tm.label} />
        </div>
        {(tm.issue || tm.wontFit) && (
          <div className="bg-[#FEF3C7] text-[#78350F] rounded-xl px-3 py-2.5 text-[13px] font-semibold flex gap-2">
            {Icon.alert()} {tm.issue ?? "Not enough time before the exam to fit this topic. Higher-priority topics are planned first."}
          </div>
        )}

        {!t.mastered && (
          <Card className="p-4 flex flex-col gap-2">
            <div className="flex justify-between items-baseline">
              <h2 className="m-0 text-sm font-extrabold">Why it's a priority</h2>
              <span className="text-[22px] font-extrabold text-[#B91C1C]">
                {Math.round(tm.score)}
                <span className="text-xs text-[#475569] font-semibold"> / 100</span>
              </span>
            </div>
            {parts.map((p) => (
              <div key={p.l} className="flex items-center gap-2.5">
                <span className="w-[86px] text-xs text-[#334155] font-semibold">{p.l}</span>
                <div aria-hidden="true" className="flex-1 h-2 rounded bg-[#F1F5F9] overflow-hidden">
                  <div className="h-full bg-[#DC2626]" style={{ width: `${p.max ? (p.v / p.max) * 100 : 0}%` }} />
                </div>
                <span className="w-8 text-right text-xs font-bold">{p.l === "Past papers" ? `+${p.v}` : Math.round(p.v)}</span>
              </div>
            ))}
          </Card>
        )}

        <div className="flex flex-col gap-1.5">
          <Label>Confidence (1 = very weak)</Label>
          <Segmented label="Confidence" options={RATINGS} value={t.confidence} onChange={(v) => set((x) => void (x.confidence = v))} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Importance</Label>
          <Segmented label="Importance" options={RATINGS} value={t.importance} onChange={(v) => set((x) => void (x.importance = v))} />
        </div>

        <Card className="p-4 grid grid-cols-3 gap-2 items-start">
          <div className="flex flex-col gap-1">
            <span className="text-[11px] text-[#475569] font-semibold">Your estimate</span>
            <Stepper label="estimated hours" value={t.estHours} min={0.5} max={60} onChange={(v) => set((x) => void (x.estHours = v))} />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[11px] text-[#475569] font-semibold">Planned{data.settings.moreTimeForWeak && t.confidence <= 2 ? " (weak topic)" : ""}</span>
            <span className="text-lg font-extrabold">{fmtH(tm.plannedHours)}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[11px] text-[#475569] font-semibold">Studied</span>
            <span className="text-lg font-extrabold">{fmtH(tm.hoursDone)}</span>
          </div>
        </Card>

        {!t.mastered && (
          <div className="text-[13px] text-[#334155] bg-[#EFF6FF] rounded-xl px-3 py-2.5">
            {next.length ? (
              <>
                <b>Next session:</b> {fmtLong(next[0].date)}
                {next.length > 1 ? `, then ${next.length - 1} more before the exam.` : "."}
              </>
            ) : (
              "No sessions planned for this topic."
            )}
          </div>
        )}

        <label className="flex flex-col gap-1.5">
          <Label>Notes</Label>
          <textarea rows={3} value={t.notes} onChange={(e) => set((x) => void (x.notes = e.target.value))} className={inputCls + " h-auto py-2.5 resize-y"} placeholder="e.g. keep mixing up the chain rule" />
        </label>

        <div className="flex items-center justify-between bg-white border border-[#E2E8F0] rounded-2xl px-4 min-h-14">
          <span className="flex flex-col">
            <span className="font-bold text-[15px]">Mastered</span>
            <span className="text-xs text-[#475569]">Removes this topic from your plan.</span>
          </span>
          <Toggle label="Mastered" on={t.mastered} onChange={(v) => set((x) => void (x.mastered = v))} />
        </div>

        <button
          onClick={async () => {
            if (!(await askConfirm(`Delete “${t.name}”? Your logged study time is kept.`, "Delete"))) return;
            update((d) => void (d.topics = d.topics.filter((x) => x.id !== id)));
            go("topics");
          }}
          className="self-start text-sm font-semibold text-[#B91C1C] min-h-11 flex items-center gap-1.5"
        >
          {Icon.trash(16)} Delete topic
        </button>
      </div>
    </div>
  );
}
