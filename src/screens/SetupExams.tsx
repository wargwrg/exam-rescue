import { useState } from "react";
import { useStore } from "../lib/store";
import { go } from "../lib/router";
import { diffDays, fmtShort, isValidISO } from "../lib/dates";
import { exampleData, uid } from "../lib/demo";
import { SUBJECT_COLORS } from "../lib/types";
import { askConfirm } from "../components/Confirm";
import { BackHeader, Dot, Icon, Label, PrimaryButton, inputCls } from "../components/ui";

export function StepHeader({ step, title, sub, back }: { step: number; title: string; sub: string; back: () => void }) {
  return (
    <>
      <BackHeader onBack={back}>
        <span className="text-[13px] font-semibold text-[#475569]">Step {step} of 3</span>
      </BackHeader>
      <div aria-hidden="true" className="grid grid-cols-3 gap-1.5">
        {[1, 2, 3].map((i) => (
          <div key={i} className={`h-1.5 rounded-full ${i <= step ? "bg-[#2563EB]" : "bg-[#E2E8F0]"}`} />
        ))}
      </div>
      <h1 className="mt-5 mb-1 text-[26px] font-extrabold tracking-tight">{title}</h1>
      <p className="m-0 text-sm leading-relaxed text-[#475569]">{sub}</p>
    </>
  );
}

export function SetupExams({ editing = false }: { editing?: boolean }) {
  const { data, update, replaceData, today } = useStore();
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [err, setErr] = useState<string | null>(null);

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return setErr("Type a subject name.");
    if (!isValidISO(date)) return setErr("Pick the exam date.");
    if (diffDays(date, today) <= 0) return setErr("That date has already passed. Pick a future exam date.");
    update((d) => {
      d.subjects.push({ id: uid(), name: name.trim(), examDate: date, ppHours: null, color: SUBJECT_COLORS[d.subjects.length % SUBJECT_COLORS.length] });
    });
    setName("");
    setDate("");
    setErr(null);
  };

  const ok = data.subjects.some((s) => isValidISO(s.examDate) && diffDays(s.examDate, today) > 0);

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <div className="max-w-[560px] mx-auto px-6 pb-10 flex flex-col min-h-screen">
        {editing ? (
          <>
            <BackHeader onBack={() => go("settings")} />
            <h1 className="mb-1 text-[26px] font-extrabold">Subjects & exams</h1>
            <p className="m-0 text-sm text-[#475569]">Changes update your plan straight away.</p>
          </>
        ) : (
          <StepHeader
            step={1}
            title="When are your exams?"
            sub="Add each subject and its exam date. Got several papers? Add each one as its own exam, e.g. “Maths P1”."
            back={() => history.back()}
          />
        )}

        <ul className="list-none p-0 mt-5 flex flex-col gap-2.5">
          {data.subjects.map((s) => {
            const days = isValidISO(s.examDate) ? diffDays(s.examDate, today) : null;
            return (
              <li key={s.id} className="bg-white border border-[#E2E8F0] rounded-2xl px-4 py-3 flex items-center gap-3">
                <Dot color={s.color} />
                <div className="flex-1 min-w-0 flex flex-col gap-1">
                  <input
                    aria-label="Subject name"
                    value={s.name}
                    onChange={(e) => update((d) => void (d.subjects.find((x) => x.id === s.id)!.name = e.target.value))}
                    className="font-bold text-[15px] bg-transparent border-0 p-0 focus:outline-none focus:underline"
                  />
                  <input
                    aria-label={`Exam date for ${s.name}`}
                    type="date"
                    value={s.examDate}
                    onChange={(e) => update((d) => void (d.subjects.find((x) => x.id === s.id)!.examDate = e.target.value))}
                    className="text-[13px] text-[#475569] bg-transparent border-0 p-0"
                  />
                </div>
                <span className={`text-xs font-bold px-2 py-1 rounded-lg ${days !== null && days > 0 ? (days <= 21 ? "bg-[#FEF3C7] text-[#92400E]" : "bg-[#DBEAFE] text-[#1E3A8A]") : "bg-[#FEE2E2] text-[#991B1B]"}`}>
                  {days === null ? "No date" : days > 0 ? `${days} days` : "Passed"}
                </span>
                <button
                  aria-label={`Delete ${s.name}`}
                  onClick={async () => {
                    const n = data.topics.filter((t) => t.subjectId === s.id).length;
                    if (n && !(await askConfirm(`Delete ${s.name} and its ${n} topic(s)?`, "Delete"))) return;
                    update((d) => {
                      d.subjects = d.subjects.filter((x) => x.id !== s.id);
                      d.topics = d.topics.filter((t) => t.subjectId !== s.id);
                    });
                  }}
                  className="w-10 h-10 -mr-2 flex items-center justify-center text-[#64748B]"
                >
                  {Icon.trash()}
                </button>
              </li>
            );
          })}
        </ul>

        <form onSubmit={add} className="mt-3 bg-white border-2 border-[#2563EB] rounded-2xl px-4 py-3.5 flex flex-col gap-2.5">
          <Label htmlFor="subj">New subject</Label>
          <input id="subj" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Biology" className={inputCls} />
          <Label htmlFor="date">Exam date</Label>
          <input id="date" type="date" value={date} min={today} onChange={(e) => setDate(e.target.value)} className={inputCls} />
          {err && (
            <p role="alert" className="text-sm text-[#B91C1C] m-0">
              {err}
            </p>
          )}
          <button type="submit" className="h-11 rounded-xl border border-dashed border-[#94A3B8] text-[#1D4ED8] font-bold text-[15px] flex items-center justify-center gap-1.5">
            {Icon.plus()} Add subject
          </button>
        </form>

        {!editing && data.subjects.length === 0 && (
          <button onClick={() => {
              replaceData(exampleData(today, data.name));
              go("today");
            }} className="mt-4 text-sm font-semibold text-[#1D4ED8] underline min-h-11">
            Just exploring? Fill in example subjects instead
          </button>
        )}

        <div className="mt-auto pt-8">
          <PrimaryButton disabled={!ok} onClick={() => go(editing ? "settings" : "setup/time")}>
            {editing ? "Done" : "Continue"}
          </PrimaryButton>
          {!ok && <p className="text-xs text-[#475569] text-center mt-2">Add at least one subject with a future exam date.</p>}
          {ok && !editing && (
            <p className="text-xs text-[#475569] text-center mt-2">
              Next exam: {data.subjects.filter((s) => isValidISO(s.examDate)).sort((a, b) => a.examDate.localeCompare(b.examDate))[0]?.name} on{" "}
              {fmtShort(data.subjects.filter((s) => isValidISO(s.examDate)).sort((a, b) => a.examDate.localeCompare(b.examDate))[0]?.examDate ?? today)}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
