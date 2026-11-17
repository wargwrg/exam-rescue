import type { ReactNode } from "react";
import { useStore } from "../lib/store";
import { DEMO_MODE, signOut } from "../lib/backend";
import { exampleData } from "../lib/demo";
import { emptyData } from "../lib/types";
import { fmtLong } from "../lib/dates";
import { askConfirm } from "../components/Confirm";
import { Icon, PageHeader, Stepper, Toggle, fmtH } from "../components/ui";
import { go } from "../lib/router";

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-1.5">
      <h2 className="m-0 text-xs font-extrabold text-[#475569] tracking-wide">{title}</h2>
      <div className="bg-white border border-[#E2E8F0] rounded-2xl divide-y divide-[#F1F5F9]">{children}</div>
    </section>
  );
}
function Row({ label, children, href, onClick, danger }: { label: string; children?: ReactNode; href?: string; onClick?: () => void; danger?: boolean }) {
  const inner = (
    <>
      <span className={`text-sm font-semibold ${danger ? "text-[#B91C1C]" : ""}`}>{label}</span>
      <span className="flex items-center gap-1.5 text-sm text-[#475569]">
        {children}
        {(href || onClick) && !danger && Icon.chevron(16)}
      </span>
    </>
  );
  const cls = "flex justify-between items-center min-h-12 px-3.5 gap-3 w-full text-left no-underline text-[#0F172A]";
  if (href)
    return (
      <a href={href} className={cls}>
        {inner}
      </a>
    );
  if (onClick)
    return (
      <button onClick={onClick} className={cls}>
        {inner}
      </button>
    );
  return <div className={cls}>{inner}</div>;
}

export function Settings() {
  const { data, update, access, account, setAccount, replaceData, today, plan } = useStore();
  const s = data.settings;

  const exportCsv = () => {
    const rows = [["Date", "Session", "Subject", "Topic", "Type", "Priority", "Hours"]];
    for (const ss of plan.sessions) {
      const t = plan.topics.find((x) => x.topic.id === ss.topicId);
      rows.push([
        ss.date,
        String(ss.numInDay),
        data.subjects.find((x) => x.id === ss.subjectId)?.name ?? "",
        ss.kind === "revision" ? t?.topic.name ?? "" : ss.kind === "pastpaper" ? "Past-paper practice" : "Buffer / review",
        ss.kind,
        ss.kind === "revision" ? t?.label ?? "" : "",
        String(plan.sessionLen),
      ]);
    }
    const csv = rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = `exam-rescue-plan-${today}.csv`;
    a.click();
  };

  return (
    <div className="max-w-[640px]">
      <PageHeader title="Settings" />
      <div className="flex flex-col gap-4">
        <a href="#/unlock" className="bg-[#14213D] text-white rounded-2xl p-4 flex justify-between items-center no-underline">
          <span className="flex flex-col gap-0.5">
            <span className="font-extrabold text-[15px]">
              {access?.kind === "paid" ? `Season pass · active until ${fmtLong(access.until.slice(0, 10))}` : access?.kind === "trial" ? `Free trial · ${access.daysLeft} day${access.daysLeft === 1 ? "" : "s"} left` : "Trial ended"}
            </span>
            <span className="text-xs text-[#CBD5E1]">{DEMO_MODE ? "Demo mode · saved in this browser" : account?.email}</span>
          </span>
          {access?.kind !== "paid" && <span className="text-[#FCD34D] font-bold text-sm">Unlock</span>}
        </a>

        <Group title="YOU">
          <Row label="Your name">
            <input aria-label="Your name" value={data.name} onChange={(e) => update((d) => void (d.name = e.target.value))} placeholder="Optional" className="text-right bg-transparent border-0 outline-none w-40" />
          </Row>
        </Group>

        <Group title="STUDY">
          <Row label="Subjects & exam dates" href="#/setup/exams">
            {data.subjects.length}
          </Row>
          <Row label="Weekly hours & days off" href="#/setup/time">
            {fmtH(data.weekly.reduce((a, b) => a + b, 0))} / week
          </Row>
          <Row label="Past-paper hours per subject">
            <Stepper label="past-paper hours" value={s.defaultPPHours} min={0} max={20} step={1} onChange={(v) => update((d) => void (d.settings.defaultPPHours = v))} />
          </Row>
          <Row label="Break per session">
            <Stepper label="break minutes" value={s.breakMin} min={0} max={30} step={5} suffix="m" onChange={(v) => update((d) => void (d.settings.breakMin = v))} />
          </Row>
        </Group>

        <Group title="PLANNER">
          <Row label="More time for weak topics">
            <Toggle label="More time for weak topics" on={s.moreTimeForWeak} onChange={(v) => update((d) => void (d.settings.moreTimeForWeak = v))} />
          </Row>
          <Row label="Study on exam days">
            <Toggle label="Study on exam days" on={s.studyOnExamDays} onChange={(v) => update((d) => void (d.settings.studyOnExamDays = v))} />
          </Row>
          <div className="px-3.5 py-3 text-xs leading-relaxed text-[#475569]">
            Priority score = 40% weakness + 30% importance + 30% exam urgency, plus up to +15 for topics flagged in past papers. High ≥ 70, Medium ≥ 45.
          </div>
        </Group>

        <Group title="DATA">
          <Row label="Download my plan (CSV, opens in Excel)" onClick={exportCsv} />
          <Row
            label="Load example data"
            onClick={async () => {
              if (await askConfirm("Replace your subjects, topics and logs with the example data?", "Load example", false)) {
                replaceData(exampleData(today, data.name));
                go("today");
              }
            }}
          />
          <Row
            label="Clear all my data"
            danger
            onClick={async () => {
              if (await askConfirm("Delete all your subjects, topics, logs and results? This can't be undone.", "Delete everything")) {
                replaceData(emptyData());
              }
            }}
          />
        </Group>

        <button
          onClick={async () => {
            await signOut();
            setAccount(null);
            go("");
          }}
          className="text-sm font-bold text-[#B91C1C] min-h-11"
        >
          {DEMO_MODE ? "Reset demo (delete trial and data)" : "Sign out"}
        </button>
        <p className="text-xs text-center text-[#64748B]">Exam Rescue by Clutch Up · a planning tool, not a guarantee of results.</p>
      </div>
    </div>
  );
}
