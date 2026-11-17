// Core data types for Exam Rescue

export type ISODate = string; // "YYYY-MM-DD"

export interface Subject {
  id: string;
  name: string;
  examDate: ISODate | "";
  ppHours: number | null; // past-paper hours to plan; null = use default
  color: string;
}

export interface Topic {
  id: string;
  subjectId: string;
  name: string;
  confidence: number; // 1–5 (1 = very weak)
  importance: number; // 1–5
  estHours: number;
  mastered: boolean;
  notes: string;
}

export type LogType = "revision" | "pastpaper" | "review";

export interface StudyLog {
  id: string;
  date: ISODate;
  subjectId: string;
  topicId: string | null;
  hours: number;
  type: LogType;
}

export interface PastPaper {
  id: string;
  subjectId: string;
  name: string;
  date: ISODate;
  marks: number;
  total: number;
  weakTopicIds: string[];
}

export interface Settings {
  sessionLen: number; // hours
  breakMin: number;
  defaultPPHours: number;
  studyOnExamDays: boolean;
  wWeak: number;
  wImp: number;
  wUrg: number;
  urgWindow: number;
  urgFull: number;
  ppBoost: number;
  ppCap: number;
  ppLookback: number;
  highThr: number;
  medThr: number;
  moreTimeForWeak: boolean;
  confMult: [number, number, number, number, number];
}

export interface AppData {
  version: 1;
  name: string;
  setupDone: boolean;
  subjects: Subject[];
  topics: Topic[];
  weekly: [number, number, number, number, number, number, number]; // Mon..Sun hours
  exceptions: Record<ISODate, number>; // date -> hours (0 = day off)
  logs: StudyLog[];
  pastPapers: PastPaper[];
  settings: Settings;
}

export const DEFAULT_SETTINGS: Settings = {
  sessionLen: 1,
  breakMin: 10,
  defaultPPHours: 3,
  studyOnExamDays: false,
  wWeak: 0.4,
  wImp: 0.3,
  wUrg: 0.3,
  urgWindow: 60,
  urgFull: 7,
  ppBoost: 5,
  ppCap: 15,
  ppLookback: 60,
  highThr: 70,
  medThr: 45,
  moreTimeForWeak: true,
  confMult: [1.3, 1.15, 1.0, 0.85, 0.7],
};

export const SUBJECT_COLORS = ["#2563EB", "#7C3AED", "#0891B2", "#DB2777", "#EA580C", "#16A34A", "#CA8A04", "#475569"];

export function emptyData(): AppData {
  return {
    version: 1,
    name: "",
    setupDone: false,
    subjects: [],
    topics: [],
    weekly: [2, 2, 2, 2, 2, 4, 4],
    exceptions: {},
    logs: [],
    pastPapers: [],
    settings: { ...DEFAULT_SETTINGS },
  };
}
