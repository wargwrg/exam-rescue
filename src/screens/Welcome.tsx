import { useState } from "react";
import { DEMO_MODE, TRIAL_DAYS, sendMagicLink, signInWithGoogle, startLocalTrial } from "../lib/backend";
import { useStore } from "../lib/store";
import { go } from "../lib/router";
import { Icon, Logo, Sheet, inputCls } from "../components/ui";

export function Welcome() {
  const { setAccount } = useStore();
  const [signIn, setSignIn] = useState<null | "new" | "existing">(null);

  const start = () => {
    if (DEMO_MODE) {
      setAccount(startLocalTrial());
      go("setup/exams");
    } else setSignIn("new");
  };

  return (
    <div className="min-h-screen bg-[#14213D] text-white flex justify-center">
      <div className="w-full max-w-[440px] px-7 pt-16 pb-10 flex flex-col min-h-screen">
        <Logo size={20} />
        <h1 className="mt-14 text-[36px] leading-[1.1] font-extrabold tracking-tight">Your revision plan, built for you.</h1>
        <p className="mt-4 text-base leading-relaxed text-[#CBD5E1]">
          Tell us your exams, topics and free time. We plan every session until your last exam, and re-plan as you go.
        </p>
        <ul className="mt-7 flex flex-col gap-2.5 text-sm text-[#E2E8F0]">
          {["A day-by-day plan in about 5 minutes", "Weakest topics first, every exam protected", "Re-plans itself when life gets in the way"].map((t) => (
            <li key={t} className="flex gap-2.5 items-center">
              <span className="text-[#4ADE80]">{Icon.check()}</span>
              {t}
            </li>
          ))}
        </ul>
        <div className="mt-auto pt-10 flex flex-col gap-3">
          <button onClick={start} className="h-14 rounded-2xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-[17px]">
            Try it free: build my plan
          </button>
          <p className="m-0 text-[13px] text-[#CBD5E1] text-center">Free for {TRIAL_DAYS} days · no card needed</p>
          {!DEMO_MODE && (
            <button onClick={() => setSignIn("existing")} className="h-[52px] rounded-2xl border border-[#475569] text-white font-semibold text-[15px] mt-2">
              I already have an account
            </button>
          )}
        </div>
        <p className="mt-5 text-xs text-[#94A3B8] text-center">
          {DEMO_MODE ? "Demo mode: your data is saved in this browser only." : "Sign in with email or Google. Works on phone and laptop."}
        </p>
      </div>
      <SignInSheet mode={signIn} onClose={() => setSignIn(null)} />
    </div>
  );
}

function SignInSheet({ mode, onClose }: { mode: null | "new" | "existing"; onClose: () => void }) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      await sendMagicLink(email.trim());
      setSent(true);
    } catch (x) {
      setErr(x instanceof Error ? x.message : "Couldn't send the link.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <Sheet open={!!mode} onClose={onClose} title={mode === "new" ? "Start your free trial" : "Welcome back"}>
      {sent ? (
        <p className="text-[15px] leading-relaxed text-[#334155]">
          Check <b>{email}</b> for a sign-in link. Open it on this device and you'll land straight in your plan.
        </p>
      ) : (
        <form onSubmit={submit} className="flex flex-col gap-3 text-[#0F172A]">
          <label htmlFor="email" className="text-sm font-semibold text-[#334155]">
            Email
          </label>
          <input id="email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@school.com" className={inputCls + " h-[52px]"} />
          <button disabled={busy} type="submit" className="h-[52px] rounded-2xl bg-[#2563EB] text-white font-bold disabled:opacity-60">
            {busy ? "Sending…" : "Email me a sign-in link"}
          </button>
          <div className="flex items-center gap-3 text-xs text-[#64748B] my-1">
            <span className="flex-1 h-px bg-[#E2E8F0]" />
            or
            <span className="flex-1 h-px bg-[#E2E8F0]" />
          </div>
          <button type="button" onClick={() => signInWithGoogle().catch((x) => setErr(String(x.message ?? x)))} className="h-[52px] rounded-2xl border border-[#CBD5E1] font-semibold">
            Continue with Google
          </button>
          {err && (
            <p role="alert" className="text-sm text-[#B91C1C]">
              {err}
            </p>
          )}
          <p className="text-xs text-[#64748B]">No password needed. Your {TRIAL_DAYS}-day trial starts when you first sign in.</p>
        </form>
      )}
    </Sheet>
  );
}
