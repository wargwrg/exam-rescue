import { useEffect, useState } from "react";
import { useStore } from "../lib/store";
import { DEMO_MODE, PRICE_LABEL, checkoutLink, demoUnlock, redeemCode } from "../lib/backend";
import { go } from "../lib/router";
import { Icon, Logo, inputCls } from "../components/ui";

const FEATURES = [
  "Your full plan, every day until your last exam",
  "Re-plans automatically when you miss a day",
  "Priority alerts and the “won't fit” warning",
  "Past-paper tracker and progress charts",
  "Phone and laptop, synced",
];

export function Unlock({ locked = false }: { locked?: boolean }) {
  const { plan, data, account, setAccount, refresh, access } = useStore();
  const [code, setCode] = useState("");
  const [codeOpen, setCodeOpen] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const done = data.logs.length;
  const link = account ? checkoutLink(account) : null;

  const buy = () => {
    if (!account) return;
    if (link) {
      window.location.href = link;
    } else if (DEMO_MODE) {
      setAccount(demoUnlock(account, data));
      go("today");
    } else setMsg("Payments aren't switched on yet. Please check back soon.");
  };

  const redeem = async () => {
    setMsg(null);
    try {
      await redeemCode(code);
      await refresh();
      go("today");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "That code didn't work.");
    }
  };

  if (access?.kind === "paid" && !locked) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6">
        <div className="max-w-sm text-center flex flex-col gap-3">
          <span className="mx-auto text-[#16A34A]">{Icon.check(40)}</span>
          <h1 className="text-2xl font-extrabold m-0">You're unlocked</h1>
          <p className="text-[#475569] m-0">Your season pass is active. Good luck with your exams!</p>
          <button onClick={() => go("today")} className="h-12 rounded-xl bg-[#2563EB] text-white font-bold mt-2">
            Back to today
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex justify-center">
      <div className="w-full max-w-[480px] flex flex-col min-h-screen bg-white lg:my-8 lg:rounded-3xl lg:overflow-hidden lg:min-h-0 lg:shadow-xl">
        <div className="bg-[#14213D] text-white px-6 pt-6 pb-7 flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <Logo size={16} />
            {locked ? (
              <a href="#/settings" className="text-[#CBD5E1] text-sm font-semibold min-h-11 flex items-center">
                Settings
              </a>
            ) : (
              <button onClick={() => history.back()} className="text-[#CBD5E1] text-sm font-semibold min-h-11">
                Not now
              </button>
            )}
          </div>
          <h1 className="m-0 text-[28px] leading-tight font-extrabold tracking-tight">
            {locked ? "Your free trial has ended." : "Your plan is ready."}
            <br />
            Keep it going.
          </h1>
          <div className="grid grid-cols-3 gap-2">
            {[
              [plan.sessions.filter((s) => s.kind !== "buffer").length, "sessions planned"],
              [plan.subjects.filter((s) => s.open).length, "exams covered"],
              [done, "sessions done"],
            ].map(([v, l]) => (
              <div key={l} className="bg-[#1E2B4A] rounded-xl p-2.5">
                <div className="text-xl font-extrabold">{v}</div>
                <div className="text-[11px] text-[#CBD5E1]">{l}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="flex-1 px-6 py-5 flex flex-col gap-4">
          <ul className="list-none m-0 p-0 flex flex-col gap-2.5">
            {FEATURES.map((f) => (
              <li key={f} className="flex gap-2.5 text-sm leading-snug">
                <span className="text-[#16A34A] mt-0.5">{Icon.check()}</span>
                {f}
              </li>
            ))}
          </ul>
          <div className="border-2 border-[#2563EB] bg-[#EFF6FF] rounded-2xl px-4 py-3.5 flex items-center gap-3">
            <span className="flex-1 flex flex-col gap-0.5">
              <span className="font-extrabold">Season pass</span>
              <span className="text-xs text-[#475569]">12 months · pay once, no subscription</span>
            </span>
            <span className="font-extrabold text-lg">{PRICE_LABEL}</span>
          </div>
          <div className="mt-auto flex flex-col gap-2">
            <button onClick={buy} className="h-14 rounded-2xl bg-[#2563EB] text-white font-bold text-[17px] flex items-center justify-center gap-2">
              {Icon.lock()} {DEMO_MODE && !link ? "Unlock (demo: no payment)" : "Unlock my plan"}
            </button>
            <p className="m-0 text-xs text-[#475569] text-center">Secure checkout · VAT included · your plan and data are kept</p>
            {!codeOpen ? (
              <button onClick={() => setCodeOpen(true)} className="text-[13px] font-semibold text-[#1D4ED8] min-h-11">
                Have a code from a store or school? Redeem it
              </button>
            ) : (
              <div className="flex gap-2 mt-1">
                <input aria-label="Access code" value={code} onChange={(e) => setCode(e.target.value)} placeholder="CODE-1234" className={inputCls + " uppercase"} />
                <button onClick={redeem} className="h-11 px-4 rounded-xl bg-[#14213D] text-white font-bold text-sm">
                  Redeem
                </button>
              </div>
            )}
            {msg && (
              <p role="alert" className="m-0 text-sm text-[#B91C1C] text-center">
                {msg}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Shown when Stripe sends the student back after paying. Polls until the webhook has unlocked the account. */
export function PaymentReturn() {
  const { access, refresh } = useStore();
  const [tries, setTries] = useState(0);
  useEffect(() => {
    if (access?.kind === "paid") {
      const t = setTimeout(() => go("today"), 1500);
      return () => clearTimeout(t);
    }
    if (tries >= 20) return;
    const t = setTimeout(() => {
      refresh().finally(() => setTries((n) => n + 1));
    }, 2500);
    return () => clearTimeout(t);
  }, [access, tries, refresh]);

  const paid = access?.kind === "paid";
  return (
    <div className="min-h-screen bg-[#14213D] text-white flex items-center justify-center p-6">
      <div className="max-w-sm text-center flex flex-col gap-3 items-center" role="status">
        <Logo size={18} />
        {paid ? (
          <>
            <span className="text-[#4ADE80] mt-4">{Icon.check(44)}</span>
            <h1 className="text-2xl font-extrabold m-0">You're unlocked!</h1>
            <p className="text-[#CBD5E1] m-0">Thanks for your purchase. Taking you to your plan…</p>
          </>
        ) : tries < 20 ? (
          <>
            <div className="mt-4 w-10 h-10 rounded-full border-4 border-[#2563EB] border-t-transparent animate-spin" aria-hidden="true" />
            <h1 className="text-2xl font-extrabold m-0">Confirming your payment…</h1>
            <p className="text-[#CBD5E1] m-0">This usually takes a few seconds.</p>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-extrabold m-0 mt-4">Still confirming</h1>
            <p className="text-[#CBD5E1] m-0">
              Your payment went through, but your account hasn't unlocked yet. Refresh this page in a minute. If it still doesn't unlock, reply to your receipt email and we'll sort it out.
            </p>
            <button onClick={() => location.reload()} className="h-12 px-5 rounded-xl bg-[#2563EB] font-bold mt-2">
              Refresh
            </button>
          </>
        )}
      </div>
    </div>
  );
}
