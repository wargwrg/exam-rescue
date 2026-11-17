import { describe, it, expect } from "vitest";
import { createHmac } from "node:crypto";
import { verifySignature, POST } from "../api/lemonsqueezy-webhook";

describe("Lemon Squeezy webhook", () => {
  const secret = "test-secret";
  const body = JSON.stringify({ meta: { event_name: "order_created", custom_data: { user_id: "not-a-uuid" } }, data: { attributes: { status: "paid" } } });
  const sig = createHmac("sha256", secret).update(body).digest("hex");

  it("accepts a correct signature", () => expect(verifySignature(body, sig, secret)).toBe(true));
  it("rejects a wrong signature", () => expect(verifySignature(body, sig.replace(/.$/, "0"), secret)).toBe(false));
  it("rejects a missing signature", () => expect(verifySignature(body, null, secret)).toBe(false));

  it("returns 401 for forged requests", async () => {
    process.env.LEMONSQUEEZY_WEBHOOK_SECRET = secret;
    const res = await POST(new Request("http://x/api", { method: "POST", body, headers: { "x-signature": "bad" } }));
    expect(res.status).toBe(401);
  });
  it("ignores orders without a valid user id", async () => {
    process.env.LEMONSQUEEZY_WEBHOOK_SECRET = secret;
    const res = await POST(new Request("http://x/api", { method: "POST", body, headers: { "x-signature": sig } }));
    expect(res.status).toBe(200);
    expect(await res.text()).toBe("No user id on order");
  });
});
