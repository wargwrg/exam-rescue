// Vercel serverless function: Lemon Squeezy calls this after someone pays.
// It checks the request really came from Lemon Squeezy, then unlocks that student for 365 days.
//
// Needs these environment variables in Vercel (Settings → Environment Variables):
//   LEMONSQUEEZY_WEBHOOK_SECRET  – the "signing secret" you type when creating the webhook
//   SUPABASE_URL                 – same value as VITE_SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY    – Supabase → Project Settings → API → service_role (keep secret!)
import { createHmac, timingSafeEqual } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

export function verifySignature(rawBody: string, signature: string | null, secret: string): boolean {
  if (!signature || !secret) return false;
  const digest = createHmac("sha256", secret).update(rawBody).digest("hex");
  const a = Buffer.from(digest, "utf8");
  const b = Buffer.from(signature, "utf8");
  return a.length === b.length && timingSafeEqual(a, b);
}

const PASS_DAYS = 365;

export async function POST(request: Request): Promise<Response> {
  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET ?? "";
  const raw = await request.text();
  if (!verifySignature(raw, request.headers.get("x-signature"), secret)) {
    return new Response("Invalid signature", { status: 401 });
  }

  let payload: {
    meta?: { event_name?: string; custom_data?: { user_id?: string } };
    data?: { attributes?: { status?: string } };
  };
  try {
    payload = JSON.parse(raw);
  } catch {
    return new Response("Bad JSON", { status: 400 });
  }

  const event = payload.meta?.event_name;
  const userId = payload.meta?.custom_data?.user_id;
  if (event !== "order_created") return new Response("Ignored", { status: 200 });
  if (payload.data?.attributes?.status !== "paid") return new Response("Not paid", { status: 200 });
  if (!userId || !/^[0-9a-f-]{36}$/i.test(userId)) return new Response("No user id on order", { status: 200 });

  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false },
  });
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
