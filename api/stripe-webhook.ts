// Vercel serverless function: Stripe calls this after someone pays.
// It checks the request really came from Stripe, then unlocks that student for 365 days.
//
// Environment variables needed in Vercel (Settings → Environment Variables):
//   STRIPE_WEBHOOK_SECRET      – "Signing secret" (whsec_…) shown on the Stripe webhook page
//   SUPABASE_URL               – same value as VITE_SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY  – Supabase → Project Settings → API keys → service_role / secret key (keep private!)
import { createHmac, timingSafeEqual } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const PASS_DAYS = 365;
const TOLERANCE_SECONDS = 300;

/** Verifies Stripe's "Stripe-Signature" header (t=…,v1=…) against the raw request body. */
export function verifyStripeSignature(rawBody: string, header: string | null, secret: string, nowSeconds = Math.floor(Date.now() / 1000)): boolean {
  if (!header || !secret) return false;
  const parts = header.split(",").map((p) => p.trim().split("="));
  const t = parts.find(([k]) => k === "t")?.[1];
  const sigs = parts.filter(([k]) => k === "v1").map(([, v]) => v);
  if (!t || !sigs.length) return false;
  if (Math.abs(nowSeconds - Number(t)) > TOLERANCE_SECONDS) return false;
  const expected = createHmac("sha256", secret).update(`${t}.${rawBody}`).digest("hex");
  const a = Buffer.from(expected, "utf8");
  return sigs.some((s) => {
    const b = Buffer.from(s, "utf8");
    return a.length === b.length && timingSafeEqual(a, b);
  });
}

export async function POST(request: Request): Promise<Response> {
  const raw = await request.text();
  if (!verifyStripeSignature(raw, request.headers.get("stripe-signature"), process.env.STRIPE_WEBHOOK_SECRET ?? "")) {
    return new Response("Invalid signature", { status: 400 });
  }

  let event: { type?: string; data?: { object?: { client_reference_id?: string | null; payment_status?: string } } };
  try {
    event = JSON.parse(raw);
  } catch {
    return new Response("Bad JSON", { status: 400 });
  }

  const handled = ["checkout.session.completed", "checkout.session.async_payment_succeeded"];
  if (!event.type || !handled.includes(event.type)) return new Response("Ignored", { status: 200 });
  const session = event.data?.object ?? {};
  if (session.payment_status !== "paid") return new Response("Not paid yet", { status: 200 });
  const userId = session.client_reference_id;
  if (!userId || !/^[0-9a-f-]{36}$/i.test(userId)) return new Response("No user id on payment", { status: 200 });

  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
  const { data: row, error: readErr } = await supabase.from("accounts").select("paid_until").eq("user_id", userId).maybeSingle();
  if (readErr) return new Response(readErr.message, { status: 500 });

  const now = Date.now();
  const from = row?.paid_until && Date.parse(row.paid_until) > now ? Date.parse(row.paid_until) : now;
  const paidUntil = new Date(from + PASS_DAYS * 86400000).toISOString();
  const { error } = row
    ? await supabase.from("accounts").update({ paid_until: paidUntil }).eq("user_id", userId)
    : await supabase.from("accounts").insert({ user_id: userId, paid_until: paidUntil });
  if (error) return new Response(error.message, { status: 500 });

  return new Response("OK", { status: 200 });
}
