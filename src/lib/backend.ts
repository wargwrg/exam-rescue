// Storage + login.
// If VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set, accounts and data live in
// Supabase. Otherwise the app runs in DEMO MODE and keeps everything in this browser.
import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";
import type { AppData } from "./types";

const URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
export const CHECKOUT_URL = (import.meta.env.VITE_CHECKOUT_URL as string | undefined) || "";
export const PRICE_LABEL = (import.meta.env.VITE_PRICE_LABEL as string | undefined) || "€14.99";
export const TRIAL_DAYS = 3;

export const supabase: SupabaseClient | null = URL && KEY ? createClient(URL, KEY) : null;
export const DEMO_MODE = !supabase;

export interface Account {
  userId: string;
  email: string | null;
  trialStartedAt: string; // ISO timestamp
  paidUntil: string | null; // ISO timestamp
  data: AppData | null;
}

const LS_ACCOUNT = "clutchup.account.v1";

// ------------------------------------------------------------------ demo (browser) storage
function loadLocal(): Account | null {
  try {
    const raw = localStorage.getItem(LS_ACCOUNT);
    return raw ? (JSON.parse(raw) as Account) : null;
  } catch {
    return null;
  }
}
function saveLocal(a: Account | null) {
  try {
    if (a) localStorage.setItem(LS_ACCOUNT, JSON.stringify(a));
    else localStorage.removeItem(LS_ACCOUNT);
  } catch {
    /* storage unavailable: data stays in memory for this visit */
  }
}

// ------------------------------------------------------------------ public API
export async function getAccount(): Promise<Account | null> {
  if (!supabase) return loadLocal();
  const { data: s } = await supabase.auth.getSession();
  const user = s.session?.user;
  if (!user) return null;
  return fetchOrCreateRow(user);
}

async function fetchOrCreateRow(user: User): Promise<Account> {
  const sb = supabase!;
  const { data: row, error } = await sb.from("accounts").select("*").eq("user_id", user.id).maybeSingle();
  if (error) throw error;
  if (row) {
    return { userId: user.id, email: user.email ?? null, trialStartedAt: row.trial_started_at, paidUntil: row.paid_until, data: row.data };
  }
  const { data: created, error: e2 } = await sb.from("accounts").insert({ user_id: user.id, data: null }).select("*").single();
  if (e2) throw e2;
  return { userId: user.id, email: user.email ?? null, trialStartedAt: created.trial_started_at, paidUntil: created.paid_until, data: null };
}

/** Demo mode only: start a local trial without an account. */
export function startLocalTrial(): Account {
  const a: Account = { userId: "local", email: null, trialStartedAt: new Date().toISOString(), paidUntil: null, data: null };
  saveLocal(a);
  return a;
}

let saveTimer: ReturnType<typeof setTimeout> | null = null;
let pending: { a: Account; d: AppData } | null = null;
export function saveData(account: Account, data: AppData) {
  if (!supabase) {
    saveLocal({ ...account, data });
    return;
  }
  // debounce cloud saves
  pending = { a: account, d: data };
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(flushSave, 800);
}
export async function flushSave() {
  if (!supabase || !pending) return;
  const { a, d } = pending;
  pending = null;
  await supabase.from("accounts").update({ data: d, updated_at: new Date().toISOString() }).eq("user_id", a.userId);
}

export async function sendMagicLink(email: string) {
  if (!supabase) throw new Error("Sign-in isn't set up yet (demo mode).");
  const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin } });
  if (error) throw error;
}

export async function signInWithGoogle() {
  if (!supabase) throw new Error("Sign-in isn't set up yet (demo mode).");
  const { error } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: window.location.origin } });
  if (error) throw error;
}

export async function signOut() {
  if (supabase) await supabase.auth.signOut();
  else saveLocal(null);
}

export async function redeemCode(code: string): Promise<string> {
  if (!supabase) throw new Error("Codes work once the app is connected to Supabase.");
  const { data, error } = await supabase.rpc("redeem_code", { p_code: code.trim().toUpperCase() });
  if (error) throw error;
  return data as string; // new paid_until
}

/** Demo mode only: pretend a purchase happened so the full app can be tested. */
export function demoUnlock(a: Account, data: AppData): Account {
  const until = new Date(Date.now() + 365 * 86400000).toISOString();
  const next = { ...a, paidUntil: until, data };
  saveLocal(next);
  return next;
}

/** Stripe Payment Link with the student's account id attached, so the webhook knows who paid. */
export function checkoutLink(a: Account): string | null {
  if (!CHECKOUT_URL) return null;
  const u = new window.URL(CHECKOUT_URL);
  u.searchParams.set("client_reference_id", a.userId);
  if (a.email) u.searchParams.set("prefilled_email", a.email);
  return u.toString();
}

export function onAuthChange(cb: () => void) {
  if (!supabase) return () => {};
  const { data } = supabase.auth.onAuthStateChange(() => cb());
  return () => data.subscription.unsubscribe();
}

// ------------------------------------------------------------------ access rules
export type Access = { kind: "paid"; until: string } | { kind: "trial"; daysLeft: number; hoursLeft: number } | { kind: "expired" };

export function accessOf(a: Account): Access {
  const now = Date.now();
  if (a.paidUntil && Date.parse(a.paidUntil) > now) return { kind: "paid", until: a.paidUntil };
  const end = Date.parse(a.trialStartedAt) + TRIAL_DAYS * 86400000;
  if (end > now) {
    const ms = end - now;
    return { kind: "trial", daysLeft: Math.ceil(ms / 86400000), hoursLeft: Math.ceil(ms / 3600000) };
  }
  return { kind: "expired" };
}
