// Example data so new users (and you) can see the planner working instantly.
import { addDays } from "./dates";
import { emptyData, SUBJECT_COLORS, type AppData, type ISODate } from "./types";

let n = 0;
export const uid = () => Math.random().toString(36).slice(2, 10) + (n++).toString(36);

export function exampleData(today: ISODate, name = ""): AppData {
  const d = emptyData();
  d.name = name;
  const subs = [
    { name: "Mathematics", days: 15 },
    { name: "Economics", days: 25 },
    { name: "Accounting", days: 35 },
  ].map((s, i) => ({ id: uid(), name: s.name, examDate: addDays(today, s.days), ppHours: null, color: SUBJECT_COLORS[i] }));
  d.subjects = subs;
  const [m, e, a] = subs.map((s) => s.id);
  const T: [string, string, number, number, number, boolean?][] = [
    [m, "Differentiation", 1, 5, 5],
    [m, "Integration", 2, 5, 5],
    [m, "Algebra", 5, 3, 2],
    [m, "Trigonometry", 3, 4, 4],
    [m, "Statistics", 3, 3, 3],
    [m, "Vectors", 2, 3, 3],
    [e, "Elasticity", 3, 4, 3],
    [e, "Market failure", 2, 5, 4],
    [e, "Macroeconomic policy", 2, 5, 4],
    [e, "Supply & demand", 5, 3, 2, true],
    [e, "International trade", 3, 3, 3],
    [e, "Inflation & unemployment", 3, 4, 3],
    [a, "Ratio analysis", 2, 5, 4],
    [a, "Cash flow statements", 2, 4, 4],
    [a, "Depreciation", 4, 3, 2],
    [a, "Partnership accounts", 3, 4, 3],
    [a, "Budgeting", 3, 3, 3],
    [a, "Bank reconciliation", 5, 2, 1],
  ];
  d.topics = T.map(([sid, nm, c, i, h, done]) => ({ id: uid(), subjectId: sid, name: nm, confidence: c, importance: i, estHours: h, mastered: !!done, notes: "" }));
  const tid = (nm: string) => d.topics.find((t) => t.name === nm)!.id;
  d.logs = [
    { id: uid(), date: addDays(today, -3), subjectId: e, topicId: tid("Supply & demand"), hours: 1.5, type: "revision" },
    { id: uid(), date: addDays(today, -2), subjectId: m, topicId: tid("Algebra"), hours: 1, type: "revision" },
    { id: uid(), date: addDays(today, -1), subjectId: m, topicId: null, hours: 1, type: "pastpaper" },
  ];
  d.pastPapers = [
    { id: uid(), subjectId: m, name: "2023 Paper 1", date: addDays(today, -12), marks: 41, total: 80, weakTopicIds: [tid("Differentiation"), tid("Integration")] },
    { id: uid(), subjectId: m, name: "2024 Paper 1", date: addDays(today, -1), marks: 50, total: 80, weakTopicIds: [tid("Differentiation")] },
  ];
  d.setupDone = true;
  return d;
}
