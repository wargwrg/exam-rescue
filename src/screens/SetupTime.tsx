import { useState } from "react";
import { useStore } from "../lib/store";
import { go } from "../lib/router";
import { WEEKDAY_SHORT, fmtLong, isValidISO } from "../lib/dates";
import { BackHeader, Bar, Icon, Label, PrimaryButton, Segmented, Stepper, Toggle, inputCls } from "../components/ui";
import { StepHeader } from "./SetupExams";

export function SetupTime({ editing = false }: { editing?: boolean }) {
  const { data, update, today } = useStore();
  const [exDate, setExDate] = useState("");
  const [exHours, setExHours] = useState(0);
  const total = data.weekly.reduce((a, b) => a + b, 0);
  const s = data.settings;

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <div className="max-w-[560px] mx-auto px-6 pb-10 flex flex-col min-h-screen">
        {editing ? (
          <>
            <BackHeader onBack={() => go("settings")} />
            <h1 className="mb-1 text-[26px] font-extrabold">Study time</h1>
            <p className="m-0 text-sm text-[#475569]">Your plan re-balances as soon as you change anything.</p>
          </>
        ) : (
          <StepHeader step={2} title="When can you study?" sub="Set your usual hours for each day. You can change single days below." back={() => go("setup/exams")} />
        )}

        <div className="mt-4 bg-white border border-[#E2E8F0] rounded-2xl px-4 py-1">
          {WEEKDAY_SHORT.map((d, i) => (
            <div key={d} className="flex items-center gap-3 h-12 border-b border-[#F1F5F9]">
              <span className="w-11 font-semibold text-[15px]">{d}</span>
              <div className="flex-1">
                <Bar pct={(data.weekly[i] / 8) * 100} h={8} />
              </div>
              <Stepper label={`time on ${d}`} value={data.weekly[i]} onChange={(v) => update((x) => void (x.weekly[i] = v))} max={16} />
            </div>
          ))}
          <div className="flex justify-between h-11 items-center">
            <span className="text-sm text-[#475569]">Total per week</span>
            <span className="font-extrabold text-[15px]">{total}h</span>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-2">
          <Label>Session length</Label>
          <Segmented
            label="Session length"
            value={s.sessionLen}
            onChange={(v) => update((x) => void (x.settings.sessionLen = v))}
            options={[
              { value: 0.5, label: "30 min" },
              { value: 1, label: "1 hour" },
              { value: 1.5, label: "1.5 hours" },
            ]}
          />
          <span className="text-xs text-[#475569]">
            Each session = {Math.round(s.sessionLen * 60 - s.breakMin)} min focus + {s.breakMin} min break.
          </span>
        </div>

        <div className="mt-5 flex items-center justify-between bg-white border border-[#E2E8F0] rounded-2xl px-4 min-h-12">
          <span className="text-sm font-semibold">Study on exam days</span>
          <Toggle label="Study on exam days" on={s.studyOnExamDays} onChange={(v) => update((x) => void (x.settings.studyOnExamDays = v))} />
        </div>

        <div className="mt-5 flex flex-col gap-2">
          <Label>Days off & busy days</Label>
          {Object.entries(data.exceptions)
            .filter(([d]) => d >= today)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([d, h]) => (
              <div key={d} className="flex items-center justify-between bg-white border border-[#E2E8F0] rounded-xl px-4 min-h-12">
                <span className="text-sm font-semibold">{fmtLong(d)}</span>
                <span className="flex items-center gap-2">
                  <span className="text-sm text-[#475569]">{h === 0 ? "Day off" : `${h}h`}</span>
                  <button aria-label={`Remove ${d}`} onClick={() => update((x) => void delete x.exceptions[d])} className="w-10 h-10 flex items-center justify-center text-[#64748B]">
                    {Icon.trash()}
                  </button>
                </span>
              </div>
            ))}
          <div className="flex flex-wrap gap-2 items-end bg-white border border-[#E2E8F0] rounded-xl p-3">
            <div className="flex-1 min-w-[150px] flex flex-col gap-1">
              <label htmlFor="exd" className="text-xs text-[#475569] font-semibold">
                Date
              </label>
              <input id="exd" type="date" min={today} value={exDate} onChange={(e) => setExDate(e.target.value)} className={inputCls} />
            </div>
            <Stepper label="hours that day" value={exHours} onChange={setExHours} max={16} />
            <button
              onClick={() => {
                if (!isValidISO(exDate)) return;
                update((x) => void (x.exceptions[exDate] = exHours));
                setExDate("");
                setExHours(0);
              }}
              className="h-11 px-4 rounded-xl bg-[#14213D] text-white font-bold text-sm ml-auto"
            >
              Add
            </button>
          </div>
          <span className="text-xs text-[#475569]">0h = day off. Exam days are kept free automatically.</span>
        </div>

        <div className="mt-auto pt-8">
          <PrimaryButton disabled={total === 0} onClick={() => go(editing ? "settings" : "setup/topics")}>
            {editing ? "Done" : "Continue to topics"}
          </PrimaryButton>
          {total === 0 && <p className="text-xs text-center text-[#B91C1C] mt-2">Add some study time to at least one day.</p>}
        </div>
      </div>
    </div>
  );
}
