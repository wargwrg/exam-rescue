import { describe, it, expect } from "vitest";
import { computePlan } from "../src/lib/engine";
import { emptyData, type AppData } from "../src/lib/types";
import { addDays } from "../src/lib/dates";
import wbFixtures from "./workbook_fixtures.json";
import fuzz from "./fuzz.json";

type WB = (typeof wbFixtures)["tc1"];

function fromWorkbook(f: WB): AppData {
  const d = emptyData();
  d.settings.sessionLen = f.sess;
  d.subjects = f.subjects.map((s, i) => ({ id: "s" + i, name: s.name, examDate: s.exam ?? "", ppHours: s.pp ?? null, color: "#000" }));
  const sid = (n: string) => d.subjects.find((s) => s.name === n)?.id ?? "missing";
  d.topics = f.topics.map((t, i) => ({
    id: "t" + i,
    subjectId: sid(t.subject),
    name: t.name ?? "",
    confidence: t.c ?? 3,
    importance: t.i ?? 3,
    estHours: typeof t.h === "number" ? t.h : 0,
    mastered: t.status === "Completed",
    notes: "",
  }));
  const tid = (sub: string, name: string | null) => d.topics.find((t) => t.subjectId === sid(sub) && t.name === name)?.id ?? null;
  d.weekly = f.weekly as AppData["weekly"];
  d.exceptions = f.exceptions as Record<string, number>;
  d.logs = f.logs.map((l, i) => ({
    id: "l" + i,
    date: l.date!,
    subjectId: sid(l.subject),
    topicId: tid(l.subject, l.topic),
    hours: l.hours,
    type: l.type === "Past paper" ? "pastpaper" : l.type === "Review" ? "review" : "revision",
  }));
  d.pastPapers = f.pp.map((p, i) => ({
    id: "p" + i,
    subjectId: sid(p.subject),
    name: "",
    date: p.date!,
    marks: 0,
    total: 1,
    weakTopicIds: p.weak.map((w) => tid(p.subject, w)).filter(Boolean) as string[],
  }));
  return d;
}

describe("matches the tested spreadsheet engine", () => {
  for (const [name, f] of Object.entries(wbFixtures)) {
    it(name, () => {
      const data = fromWorkbook(f as WB);
      const plan = computePlan(data, f.start!);
      // topic scores and remaining hours
      for (const t of (f as WB).topics) {
        if (!t.name || typeof t.score !== "number") continue;
        const tm = plan.topics.find((x) => x.topic.name === t.name && x.subject?.name === t.subject)!;
        expect(tm.score, t.name).toBeCloseTo(t.score, 1);
        if (typeof t.rem === "number") expect(tm.remaining, t.name).toBeCloseTo(t.rem, 6);
      }
      // every session: same date, subject, topic
      const name2 = (id: string) => data.subjects.find((s) => s.id === id)!.name;
      const got = plan.sessions.map((s) => ({
        date: s.date,
        subject: name2(s.subjectId),
        kind: s.kind === "buffer" ? 2 : 1,
        topic: s.kind === "revision" ? data.topics.find((t) => t.id === s.topicId)!.name : s.kind,
      }));
      const want = (f as WB).sessions.map((s) => ({
        date: s.date,
        subject: s.subject,
        kind: s.kind,
        topic: s.kind === 2 ? "buffer" : s.topic.startsWith("Past-paper") ? "pastpaper" : s.topic,
      }));
      expect(got).toEqual(want);
      expect(plan.totals.shortfall).toBeCloseTo((f as WB).shortfall, 6);
    });
  }
});

describe("fuzz: matches reference scheduler", () => {
  it("300 random scenarios", () => {
    const start = "2027-01-04";
    for (const c of fuzz as { rem: number[]; exam: number[]; spd: number[]; picks: number[]; short: number[] }[]) {
      const d = emptyData();
      d.settings.studyOnExamDays = true;
      d.settings.defaultPPHours = 0;
      d.weekly = [0, 0, 0, 0, 0, 0, 0];
      c.spd.forEach((n, k) => (d.exceptions[addDays(start, k)] = n));
      d.subjects = c.rem.map((_, k) => ({ id: "s" + k, name: "S" + k, examDate: addDays(start, c.exam[k]), ppHours: 0, color: "" }));
      d.topics = c.rem.map((r, k) => ({ id: "t" + k, subjectId: "s" + k, name: "T" + k, confidence: 3, importance: 3, estHours: r, mastered: false, notes: "" }));
      const plan = computePlan(d, start);
      // compare (block number, subject) of every real work session
      const work = plan.sessions.filter((s) => s.kind !== "buffer").map((s) => [s.index, Number(s.subjectId.slice(1))]);
      const want = c.picks.map((p, i) => [i + 1, p]).filter(([, p]) => p >= 0);
      expect(work).toEqual(want);
      plan.subjects.forEach((s, k) => expect(s.shortfall).toBeCloseTo(c.short[k], 6));
    }
  });
});
