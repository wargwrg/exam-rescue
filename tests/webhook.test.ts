import { describe, it, expect } from "vitest";
import { createHmac } from "node:crypto";
import { verifyStripeSignature, POST } from "../api/stripe-webhook";

const secret = "whsec_test";
const sign = (body: string, t = Math.floor(Date.now() / 1000)) => `t=${t},v1=${createHmac("sha256", secret).update(`${t}.${body}`).digest("hex")}`;
const body = JSON.stringify({ type: "checkout.session.completed", data: { object: { client_reference_id: "not-a-uuid", payment_status: "paid" } } });

describe("Stripe webhook", () => {
  it("accepts a correct signature", () => expect(verifyStripeSignature(body, sign(body), secret)).toBe(true));
  it("rejects a tampered body", () => expect(verifyStripeSignature(body + " ", sign(body), secret)).toBe(false));
  it("rejects an old (replayed) signature", () => expect(verifyStripeSignature(body, sign(body, 1_000_000), secret)).toBe(false));
  it("rejects a missing signature", () => expect(verifyStripeSignature(body, null, secret)).toBe(false));

  it("returns 400 for forged requests", async () => {
    process.env.STRIPE_WEBHOOK_SECRET = secret;
    const res = await POST(new Request("http://x/api", { method: "POST", body, headers: { "stripe-signature": "t=1,v1=bad" } }));
    expect(res.status).toBe(400);
  });
  it("ignores payments without a valid user id", async () => {
    process.env.STRIPE_WEBHOOK_SECRET = secret;
    const res = await POST(new Request("http://x/api", { method: "POST", body, headers: { "stripe-signature": sign(body) } }));
    expect(await res.text()).toBe("No user id on payment");
  });
  it("ignores other event types", async () => {
    process.env.STRIPE_WEBHOOK_SECRET = secret;
    const b = JSON.stringify({ type: "customer.created" });
    const res = await POST(new Request("http://x/api", { method: "POST", body: b, headers: { "stripe-signature": sign(b) } }));
    expect(await res.text()).toBe("Ignored");
  });
});
