import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { accessOf, getAccount, onAuthChange, saveData, type Access, type Account } from "./backend";
import { computePlan, type Plan } from "./engine";
import { todayISO } from "./dates";
import { emptyData, type AppData } from "./types";

interface Store {
  loading: boolean;
  error: string | null;
  account: Account | null;
  setAccount: (a: Account | null) => void;
  access: Access | null;
  data: AppData;
  update: (fn: (d: AppData) => AppData | void) => void;
  replaceData: (d: AppData) => void;
  plan: Plan;
  today: string;
  refresh: () => Promise<void>;
}

const Ctx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [account, setAccountState] = useState<Account | null>(null);
  const [data, setData] = useState<AppData>(emptyData());
  const [today, setToday] = useState(todayISO());

  const refresh = useCallback(async () => {
    try {
      const a = await getAccount();
      setAccountState(a);
      setData(a?.data ? migrate(a.data) : emptyData());
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't load your data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const off = onAuthChange(() => refresh());
    // roll the plan over at midnight / when the tab wakes up
    const t = setInterval(() => setToday(todayISO()), 60000);
    return () => {
      off();
      clearInterval(t);
    };
  }, [refresh]);

  const setAccount = useCallback((a: Account | null) => {
    setAccountState(a);
    setData(a?.data ? migrate(a.data) : emptyData());
  }, []);

  const update = useCallback(
    (fn: (d: AppData) => AppData | void) => {
      setData((prev) => {
        const draft: AppData = structuredClone(prev);
        const out = fn(draft) ?? draft;
        if (account) saveData(account, out);
        return out;
      });
    },
    [account],
  );

  const replaceData = useCallback(
    (d: AppData) => {
      setData(d);
      if (account) saveData(account, d);
    },
    [account],
  );

  const plan = useMemo(() => computePlan(data, today), [data, today]);
  const access = account ? accessOf(account) : null;

  return (
    <Ctx.Provider value={{ loading, error, account, setAccount, access, data, update, replaceData, plan, today, refresh }}>
      {children}
    </Ctx.Provider>
  );
}

export function useStore() {
  const s = useContext(Ctx);
  if (!s) throw new Error("useStore outside provider");
  return s;
}

function migrate(d: AppData): AppData {
  const base = emptyData();
  return { ...base, ...d, settings: { ...base.settings, ...(d.settings || {}) } };
}
