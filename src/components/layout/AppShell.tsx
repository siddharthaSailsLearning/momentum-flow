import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { MobileNav } from "./MobileNav";
import { TopBar } from "./TopBar";
import { ReminderOverlay } from "@/components/overlay/ReminderOverlay";
import { useEngineRuntime } from "@/hooks/useEngineRuntime";

export const AppShell = ({ children }: { children: ReactNode }) => {
  useEngineRuntime();
  return (
    <div className="relative flex min-h-screen w-full">
      <Sidebar />
      <main className="flex min-h-screen flex-1 flex-col">
        <TopBar />
        <div className="flex-1 px-4 pb-24 pt-2 md:px-8 md:pb-10">
          <div className="mx-auto w-full max-w-5xl animate-fade-in">{children}</div>
        </div>
      </main>
      <MobileNav />
      <ReminderOverlay />
    </div>
  );
};
