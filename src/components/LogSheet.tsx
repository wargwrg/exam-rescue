import { useEffect, useState } from "react";
import { useStore } from "../lib/store";
import { uid } from "../lib/demo";
import type { LogType } from "../lib/types";
import { Dot, Label, Segmented, Sheet, inputCls } from "./ui";

export interface LogPreset {
  subjectId: string;
  topicId: string | null;
  kind: "revision" | "pastpaper" | "buffer";
}

const TIMES = [0.5, 0.75, 1, 1.5];

export function LogSheet({ preset, onClose }: { preset: LogPreset | null | "free"; onClose: () => void }) {
  const { data, update, today, plan } = useStore();
  const free = preset === "free";
  const p = free ? null : preset;
  const [subjectId, setSubjectId] = useState("");
  const [topicId, setTopicId] = useState<string>("");
  const [type, setType] = useState<LogType>("revision");
  const [hours, setHours] = useState(plan.sessionLen);
  const [other, setOther] = useState(false);
  const [conf, setConf] = useState(3);
  const [mastered, setMastered] = useState(false);

  useEffect(() => {
    if (!preset) return;
    setHours(plan.sessionLen);
    setOther(!TIMES.includes(plan.sessionLen));
    setMastered(false);
    if (preset === "free") {
      const s = data.subjects[0]?.id ?? "";
      setSubjectId(s);
      setTopicId("");
      setType("revision");
    } else {
      setSubjectId(preset.subjectId);
      setTopicId(preset.topicId ?? "");
      setType(preset.kind === "pastpaper" ? "pastpaper" : preset.kind === "buffer" ? "review" : "revision");
      const t = data.topics.find((x) => x.id === preset.topicId);
      setConf(t?.confidence ?? 3);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preset]);

  const subject = data.subjects.find((s) => s.id === subjectId);
  const topic = data.topics.find((t) => t.id === topicId);
  useEffect(() => {
    if (topic) setConf(topic.confidence);
  }, [topic]);

  const save = () => {
    if (!subjectId || !(hours > 0)) return;
    update((d) => {
      d.logs.push({ id: uid(), date: today, subjectId, topicId: topicId || null, hours, type });
      const t = d.topics.find((x) => x.id === topicId);
      if (t) {
        t.confidence = conf;
        if (mastered) t.mastered = true;
      }
    });
    onClose();
  };

  const title = free ? "Log a study session" : topic ? `Nice work on ${topic.name}` : type === "pastpaper" ? "Past paper done" : "Session done";

  return (
    <Sheet open={!!preset} onClose={onClose} title={title}>
      <div className="flex flex-col gap-5">
        {p && subject && (
          <div className="flex items-center gap-1.5 -mt-1">
            <Dot color={subject.color} />
            <span className="text-[13px] font-semibold text-[#475569]">{subject.name}</span>
          </div>
        )}
        {free && (
          <>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="lsub">Subject</Label>
              <select
                id="lsub"
                className={inputCls}
                value={subjectId}
                onChange={(e) => {
                  setSubjectId(e.target.value);
                  setTopicId("");
                }}
              >
                {data.subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>What did you do?</Label>
              <Segmented
                label="Session type"
                value={type}
                onChange={setType}
                options={[
                  { value: "revision", label: "Revision" },
                  { value: "pastpaper", label: "Past paper" },
                  { value: "review", label: "Review" },
                ]}
              />
            </div>
            {type !== "pastpaper" && (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="ltop">Topic</Label>
                <select id="ltop" className={inputCls} value={topicId} onChange={(e) => setTopicId(e.target.value)}>
                  <option value="">General / no specific topic</option>
                  {data.topics
                    .filter((t) => t.subjectId === subjectId)
                    .map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                </select>
              </div>
            )}
          </>
        )}

        <div className="flex flex-col gap-2">
          <Label>How long did you study?</Label>
          <Segmented
            label="Time studied"
            value={other ? -1 : hours}
            onChange={(v) => {
              if (v === -1) setOther(true);
              else {
                setOther(false);
                setHours(v);
              }
            }}
            options={[...TIMES.map((t) => ({ value: t, label: t < 1 ? `${t * 60}m` : `${t}h` })), { value: -1, label: "Other" }]}
          />
          {other && (
            <label className="flex items-center gap-2 text-sm">
              <input type="number" min={0.25} max={12} step={0.25} value={hours} onChange={(e) => setHours(Number(e.target.value))} className={inputCls + " w-28"} aria-label="Hours studied" />
              hours
            </label>
          )}
        </div>

        {topic && (
          <>
            <div className="flex flex-col gap-2">
              <Label>How confident do you feel now?</Label>
              <Segmented label="Confidence" value={conf} onChange={setConf} options={[1, 2, 3, 4, 5].map((v) => ({ value: v, label: String(v) }))} />
              <span className="text-xs text-[#475569]">Was {topic.confidence}. Updating this re-prioritises the topic straight away.</span>
            </div>
            <label className="flex items-center gap-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-3.5 py-3 min-h-11">
              <input type="checkbox" checked={mastered} onChange={(e) => setMastered(e.target.checked)} className="w-[22px] h-[22px] accent-[#16A34A]" />
              <span className="flex flex-col gap-0.5">
                <span className="font-bold text-[15px]">I've mastered this topic</span>
                <span className="text-xs text-[#475569]">Only tick when you're confident. Time spent ≠ mastered.</span>
              </span>
            </label>
          </>
        )}

        <button onClick={save} className="h-[54px] rounded-2xl bg-[#2563EB] text-white font-bold text-base">
          Save session
        </button>
      </div>
    </Sheet>
  );
}
