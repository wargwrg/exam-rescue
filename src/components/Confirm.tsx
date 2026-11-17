import { useEffect, useState } from "react";
import { Sheet } from "./ui";

type Req = { message: string; confirmLabel: string; danger: boolean; resolve: (ok: boolean) => void };
let push: ((r: Req) => void) | null = null;

/** In-app replacement for window.confirm (which phones and embedded pages often block). */
export function askConfirm(message: string, confirmLabel = "Yes, continue", danger = true): Promise<boolean> {
  return new Promise((resolve) => {
    if (push) push({ message, confirmLabel, danger, resolve });
    else resolve(false);
  });
}

export function ConfirmHost() {
  const [req, setReq] = useState<Req | null>(null);
  useEffect(() => {
    push = setReq;
    return () => {
      push = null;
    };
  }, []);
  const close = (ok: boolean) => {
    req?.resolve(ok);
    setReq(null);
  };
  return (
    <Sheet open={!!req} onClose={() => close(false)} title="Are you sure?">
      <p className="mt-0 mb-5 text-[15px] leading-relaxed text-[#334155]">{req?.message}</p>
      <div className="grid grid-cols-2 gap-2">
        <button onClick={() => close(false)} className="h-12 rounded-xl border border-[#CBD5E1] font-bold">
          Cancel
        </button>
        <button onClick={() => close(true)} className={`h-12 rounded-xl text-white font-bold ${req?.danger ? "bg-[#DC2626]" : "bg-[#2563EB]"}`}>
          {req?.confirmLabel}
        </button>
      </div>
    </Sheet>
  );
}
