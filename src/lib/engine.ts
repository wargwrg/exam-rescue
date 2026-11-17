// Exam Rescue planning engine.
// Same algorithm as the tested spreadsheet version:
//  1. Every topic gets a priority score (weakness, importance, exam urgency, past-paper flags).
//  2. Estimated hours are adjusted for confidence and rounded up to whole sessions.
//  3. Available time is split into sessions. Each session goes to the subject that is
//     furthest behind its fair share (stride scheduling weighted by required pace).
//     If any exam becomes tight, the planner switches to earliest-exam-first, which
//     protects every deadline whenever a feasible plan exists.
//  4. Inside a subject, topics are covered in priority order; past papers come last.
//  5. Spare time becomes "buffer" sessions for the next exam's subject.
import type { AppData, ISODate, Subject, Topic } from "./types";
import { addDays, diffDays, isValidISO, weekdayMon0 } from "./dates";

export type PriorityLabel = "High" | "Medium" | "Low" | "Mastered";
export type TopicStatus = "Not started" | "In progress" | "Mastered";
export type SessionKind = "revision" | "pastpaper" | "buffer";

export interface TopicMetrics {
  topic: Topic;
  subject: Subject | undefined;
  hoursDone: number;
  plannedHours: number; // estimate adjusted for confidence (unrounded)
  remaining: number; // hours still to schedule (whole sessions)
  daysToExam: number | null;
  ppFlags: number;
  score: number;
  scoreParts: { weakness: number; importance: number; urgency: number; pastPapers: number };
  label: PriorityLabel;
  status: TopicStatus;
  active: boolean;
  firstSession: ISODate | null;
  sessionsPlanned: number;
  wontFit: boolean;
  issue: string | null;
}

export interface Session {
  index: number;
  date: ISODate;
  dayIndex: number;
  numInDay: number;
  subjectId: string;
  topicId: string | null;
  kind: SessionKind;
  tight: boolean;
}

export interface SubjectStats {
  subject: Subject;
  open: boolean;
  daysLeft: number | null;
  topicHours: number;
  ppRemaining: number;
  totalRemaining: number;
  capacityHours: number;
  scheduledHours: number;
  shortfall: number;
  topicsTotal: number;
  topicsMastered: number;
}

export interface Plan {
  today: ISODate;
  sessionLen: number;
  topics: TopicMetrics[];
  subjects: SubjectStats[];
  sessions: Session[];
  days: { date: ISODate; capacity: number; sessions: number; examDay: boolean }[];
  totals: {
    workload: number;
    scheduled: number;
    shortfall: number;
    capacity: number;
    topics: number;
    mastered: number;
    hoursLogged: number;
  };
  nextExam: { subject: Subject; date: ISODate; days: number } | null;
}

const EPS = 1e-6;
const MAX_DAYS = 200;
const MAX_SESSIONS = 3000;

function roundUpToSessions(hours: number, L: number) {
  return Math.max(0, Math.ceil(hours / L - EPS)) * L;
}

export function computePlan(data: AppData, today: ISODate): Plan {
  const s = data.settings;
  const L = s.sessionLen >= 0.25 ? s.sessionLen : 1;

  // ---- subjects
  const openSubject = new Map<string, boolean>();
  for (const sub of data.subjects) {
    const ok = sub.name.trim() !== "" && isValidISO(sub.examDate) && diffDays(sub.examDate, today) > 0;
    openSubject.set(sub.id, ok);
  }
  const subjById = new Map(data.subjects.map((x) => [x.id, x]));

  // ---- topic metrics
  const dupKey = new Map<string, number>();
  for (const t of data.topics) {
    const k = `${t.subjectId}::${t.name.trim().toLowerCase()}`;
    dupKey.set(k, (dupKey.get(k) ?? 0) + 1);
  }
  const lookbackFrom = addDays(today, -s.ppLookback);
  const topics: TopicMetrics[] = data.topics.map((t, order) => {
    const subject = subjById.get(t.subjectId);
    const hoursDone = data.logs
      .filter((l) => l.topicId === t.id && l.type !== "pastpaper")
      .reduce((a, l) => a + (Number(l.hours) || 0), 0);
    const c = clamp(Math.round(t.confidence || 3), 1, 5);
    const imp = clamp(Math.round(t.importance || 3), 1, 5);
    const mult = s.moreTimeForWeak ? s.confMult[c - 1] ?? 1 : 1;
    const est = Number(t.estHours) || 0;
    const plannedHours = est * mult;
    const exam = subject && isValidISO(subject.examDate) ? subject.examDate : null;
    const daysToExam = exam ? diffDays(exam, today) : null;
    const ppFlags = data.pastPapers.filter(
      (p) => p.subjectId === t.subjectId && p.date >= lookbackFrom && p.weakTopicIds.includes(t.id),
    ).length;
    const U =
      daysToExam === null
        ? 0
        : Math.max(0, Math.min(1, 1 - (daysToExam - s.urgFull) / Math.max(1, s.urgWindow - s.urgFull)));
    const weakness = 100 * s.wWeak * ((5 - c) / 4);
    const importance = 100 * s.wImp * ((imp - 1) / 4);
    const urgency = 100 * s.wUrg * U;
    const pastPapers = Math.min(s.ppCap, ppFlags * s.ppBoost);
    const score = Math.min(100, round1(weakness + importance + urgency + pastPapers));
    let remaining = 0;
    if (!t.mastered && est > 0) {
      remaining = roundUpToSessions(hoursDone >= plannedHours ? L : plannedHours - hoursDone, L);
    }
    const open = !!openSubject.get(t.subjectId);
    const active = open && t.name.trim() !== "" && remaining > 0;
    const label: PriorityLabel = t.mastered ? "Mastered" : score >= s.highThr ? "High" : score >= s.medThr ? "Medium" : "Low";
    const status: TopicStatus = t.mastered ? "Mastered" : hoursDone > 0 ? "In progress" : "Not started";
    let issue: string | null = null;
    if (!subject) issue = "Choose a subject";
    else if (!isValidISO(subject.examDate)) issue = "Add the exam date for this subject";
    else if (!open) issue = "Exam date has passed";
    else if (!t.name.trim()) issue = "Add a topic name";
    else if (!(est > 0) && !t.mastered) issue = "Add estimated hours";
    else if ((dupKey.get(`${t.subjectId}::${t.name.trim().toLowerCase()}`) ?? 0) > 1) issue = "Duplicate topic name";
    return {
      topic: t,
      subject,
      hoursDone,
      plannedHours,
      remaining,
      daysToExam,
      ppFlags,
      score,
      scoreParts: { weakness: round1(weakness), importance: round1(importance), urgency: round1(urgency), pastPapers },
      label,
      status,
      active,
      firstSession: null,
      sessionsPlanned: 0,
      wontFit: false,
      issue,
      _order: order,
    } as TopicMetrics & { _order: number };
  });

  // ---- per subject ordered topic lists and remaining
  const S = data.subjects.filter((x) => openSubject.get(x.id));
  const sIndex = new Map(S.map((x, i) => [x.id, i]));
  const ordered: (TopicMetrics & { _order: number; cumEnd: number })[][] = S.map(() => []);
  for (const tm of topics as (TopicMetrics & { _order: number; cumEnd: number })[]) {
    if (tm.active) ordered[sIndex.get(tm.topic.subjectId)!].push(tm);
  }
  for (const list of ordered) {
    list.sort((a, b) => b.score - a.score || a._order - b._order);
    let cum = 0;
    for (const tm of list) {
      cum += tm.remaining;
      tm.cumEnd = cum;
    }
  }
  const topicHours = ordered.map((l) => l.reduce((a, t) => a + t.remaining, 0));
  const ppRem = S.map((sub) => {
    const planned = sub.ppHours ?? s.defaultPPHours;
    const done = data.logs.filter((l) => l.subjectId === sub.id && l.type === "pastpaper").reduce((a, l) => a + (Number(l.hours) || 0), 0);
    return roundUpToSessions(Math.max(0, planned - done), L);
  });
  const totalRem = S.map((_, i) => topicHours[i] + ppRem[i]);
  const examOf = S.map((sub) => sub.examDate as ISODate);

  // ---- days & capacity
  const lastExam = examOf.reduce<ISODate | null>((m, d) => (!m || d > m ? d : m), null);
  const examDates = new Set(examOf);
  const loggedToday = data.logs.filter((l) => l.date === today).reduce((a, l) => a + (Number(l.hours) || 0), 0);
  const days: Plan["days"] = [];
  if (lastExam) {
    const n = Math.min(MAX_DAYS, diffDays(lastExam, today));
    for (let k = 0; k < n; k++) {
      const date = addDays(today, k);
      const examDay = examDates.has(date);
      let cap = date in data.exceptions ? Number(data.exceptions[date]) || 0 : Number(data.weekly[weekdayMon0(date)]) || 0;
      if (examDay && !s.studyOnExamDays) cap = 0;
      if (k === 0) cap = Math.max(0, cap - loggedToday);
      days.push({ date, capacity: cap, sessions: Math.floor(cap / L + EPS), examDay });
    }
  }
  const blocks: { date: ISODate; dayIndex: number; numInDay: number }[] = [];
  days.forEach((d, di) => {
    for (let j = 0; j < d.sessions && blocks.length < MAX_SESSIONS; j++) blocks.push({ date: d.date, dayIndex: di, numInDay: j + 1 });
  });
  const lastBlock = examOf.map((ex) => blocks.filter((b) => b.date < ex).length);

  // ---- allocation
  const rem = [...totalRem];
  const sessions: Session[] = [];
  const nS = S.length;
  for (let i = 1; i <= blocks.length; i++) {
    const b = blocks[i - 1];
    const ra = rem.map((r, k) => (lastBlock[k] >= i ? r : 0));
    let pick = -1;
    let tight = false;
    if (ra.some((x) => x > EPS)) {
      const slack = ra.map((r, k) => {
        if (r <= EPS) return 1e9;
        let need = 0;
        for (let t = 0; t < nS; t++) if (examOf[t] <= examOf[k]) need += ra[t];
        return (lastBlock[k] - i + 1) * L - need;
      });
      tight = Math.min(...slack) < L - EPS;
      if (tight) {
        // earliest exam first among subjects with work left
        for (let k = 0; k < nS; k++) {
          if (ra[k] > EPS && (pick === -1 || examOf[k] < examOf[pick])) pick = k;
        }
      } else {
        let bestPr = Infinity;
        for (let k = 0; k < nS; k++) {
          if (ra[k] <= EPS) continue;
          const a = (totalRem[k] - rem[k]) / L;
          const pr = ((a + 1) * (lastBlock[k] - i + 1) * L) / ra[k];
          if (pr < bestPr - 1e-9) {
            bestPr = pr;
            pick = k;
          }
        }
      }
    }
    if (pick >= 0) {
      const doneBefore = totalRem[pick] - rem[pick];
      const list = ordered[pick];
      const tm = list.find((t) => t.cumEnd > doneBefore + 1e-9);
      sessions.push({
        index: i,
        date: b.date,
        dayIndex: b.dayIndex,
        numInDay: b.numInDay,
        subjectId: S[pick].id,
        topicId: tm ? tm.topic.id : null,
        kind: tm ? "revision" : "pastpaper",
        tight,
      });
      rem[pick] -= L;
    } else {
      // buffer: subject with the nearest upcoming exam after this date
      let best = -1;
      for (let k = 0; k < nS; k++) if (examOf[k] > b.date && (best === -1 || examOf[k] < examOf[best])) best = k;
      if (best >= 0)
        sessions.push({ index: i, date: b.date, dayIndex: b.dayIndex, numInDay: b.numInDay, subjectId: S[best].id, topicId: null, kind: "buffer", tight: false });
    }
  }

  // ---- topic schedule info
  const tmById = new Map(topics.map((t) => [t.topic.id, t]));
  for (const ss of sessions) {
    if (ss.topicId) {
      const tm = tmById.get(ss.topicId)!;
      tm.sessionsPlanned++;
      if (!tm.firstSession) tm.firstSession = ss.date;
    }
  }
  for (const tm of topics) if (tm.active && tm.sessionsPlanned === 0) tm.wontFit = true;

  // ---- subject stats
  const subjects: SubjectStats[] = data.subjects.map((sub) => {
    const k = sIndex.get(sub.id);
    const subTopics = data.topics.filter((t) => t.subjectId === sub.id && t.name.trim());
    const open = !!openSubject.get(sub.id);
    const scheduled = sessions.filter((x) => x.subjectId === sub.id && x.kind !== "buffer").length * L;
    const total = k === undefined ? 0 : totalRem[k];
    return {
      subject: sub,
      open,
      daysLeft: isValidISO(sub.examDate) ? diffDays(sub.examDate, today) : null,
      topicHours: k === undefined ? 0 : topicHours[k],
      ppRemaining: k === undefined ? 0 : ppRem[k],
      totalRemaining: total,
      capacityHours: k === undefined ? 0 : lastBlock[k] * L,
      scheduledHours: scheduled,
      shortfall: Math.max(0, total - scheduled),
      topicsTotal: subTopics.length,
      topicsMastered: subTopics.filter((t) => t.mastered).length,
    };
  });

  const named = data.topics.filter((t) => t.name.trim());
  const totals = {
    workload: totalRem.reduce((a, b) => a + b, 0),
    scheduled: sessions.filter((x) => x.kind !== "buffer").length * L,
    shortfall: subjects.reduce((a, b) => a + b.shortfall, 0),
    capacity: blocks.length * L,
    topics: named.length,
    mastered: named.filter((t) => t.mastered).length,
    hoursLogged: data.logs.reduce((a, l) => a + (Number(l.hours) || 0), 0),
  };
  let nextExam: Plan["nextExam"] = null;
  for (const sub of S) {
    if (!nextExam || sub.examDate < nextExam.date) nextExam = { subject: sub, date: sub.examDate as ISODate, days: diffDays(sub.examDate, today) };
  }
  for (const t of topics) delete (t as unknown as Record<string, unknown>)._order;
  for (const t of topics) delete (t as unknown as Record<string, unknown>).cumEnd;
  return { today, sessionLen: L, topics, subjects, sessions, days, totals, nextExam };
}

function clamp(x: number, a: number, b: number) {
  return Math.max(a, Math.min(b, x));
}
function round1(x: number) {
  return Math.round(x * 10 + 1e-9) / 10;
}

// ---------------------------------------------------------------- stats helpers
export function hoursThisWeek(data: AppData, today: ISODate): number {
  const start = addDays(today, -weekdayMon0(today));
  return data.logs.filter((l) => l.date >= start && l.date <= today).reduce((a, l) => a + (Number(l.hours) || 0), 0);
}

export function studyStreak(data: AppData, today: ISODate): number {
  const studied = new Set(data.logs.filter((l) => l.hours > 0).map((l) => l.date));
  let d = studied.has(today) ? today : addDays(today, -1);
  let n = 0;
  while (studied.has(d)) {
    n++;
    d = addDays(d, -1);
  }
  return n;
}
