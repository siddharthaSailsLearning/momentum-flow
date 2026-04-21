import { useEngine } from "@/services/engine";
import { AppShell } from "@/components/layout/AppShell";
import { Dashboard } from "./Dashboard";
import { Onboarding } from "./Onboarding";

const Index = () => {
  const onboarded = useEngine((s) => s.settings.onboarded);
  if (!onboarded) return <Onboarding />;
  return (
    <AppShell>
      <Dashboard />
    </AppShell>
  );
};

export default Index;
