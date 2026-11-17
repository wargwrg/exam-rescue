import { useStore } from "./lib/store";
import { useRoute } from "./lib/router";
import { Shell } from "./components/Shell";
import { Welcome } from "./screens/Welcome";
import { SetupExams } from "./screens/SetupExams";
import { SetupTime } from "./screens/SetupTime";
import { Today } from "./screens/Today";
import { PlanScreen } from "./screens/Plan";
import { Topics } from "./screens/Topics";
import { TopicDetail } from "./screens/TopicDetail";
import { Progress } from "./screens/Progress";
import { Settings } from "./screens/Settings";
import { PaymentReturn, Unlock } from "./screens/Unlock";

export default function App() {
  const { loading, error, account, data, access } = useStore();
  const [page = "", arg] = useRoute();

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#14213D] text-white" role="status">
        Loading your plan…
      </div>
    );
  if (error)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 p-8 text-center">
        <p className="font-bold">Something went wrong loading your data.</p>
        <p className="text-sm text-[#475569]">{error}</p>
        <button className="underline" onClick={() => location.reload()}>
          Try again
        </button>
      </div>
    );

  // not signed in / no trial yet
  if (!account) return <Welcome />;

  // first-time setup
  if (!data.setupDone) {
    if (page === "setup" && arg === "time") return <SetupTime />;
    if (page === "setup" && arg === "topics")
      return (
        <div className="min-h-screen bg-[#F8FAFC]">
          <main className="max-w-[720px] mx-auto px-5 pb-12">
            <Topics setup />
          </main>
        </div>
      );
    return <SetupExams />;
  }

  // back from Stripe checkout: wait for the payment to be confirmed
  if (page === "paid") return <PaymentReturn />;

  // trial over and not paid: only Unlock and Settings are available
  if (access?.kind === "expired" && page !== "settings") return <Unlock locked />;

  if (page === "setup" && arg === "time") return <SetupTime editing />;
  if (page === "setup" && arg === "exams") return <SetupExams editing />;
  if (page === "unlock") return <Unlock />;

  const active = ["plan", "topics", "progress", "settings", "topic"].includes(page) ? page : "today";
  return (
    <Shell active={active === "topic" ? "topics" : active}>
      {page === "plan" ? (
        <PlanScreen />
      ) : page === "topics" ? (
        <Topics />
      ) : page === "topic" && arg ? (
        <TopicDetail id={arg} />
      ) : page === "progress" ? (
        <Progress />
      ) : page === "settings" ? (
        <Settings />
      ) : (
        <Today />
      )}
    </Shell>
  );
}
