import { useEffect, useState } from "react";
import { Activity, Focus, Pause, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useEngine } from "@/services/engine";

const formatRemaining = (ms: number) => {
  const m = Math.max(0, Math.ceil(ms / 60_000));
  if (m >= 60) return `${Math.floor(m / 60)}h ${m % 60}m`;
  return `${m}m`;
};

export const TopBar = () => {
  const focusModeOn = useEngine((s) => s.settings.focusModeOn);
  const pausedUntil = useEngine((s) => s.settings.pausedUntil);
  const toggleFocus = useEngine((s) => s.toggleFocusMode);
  const pause = useEngine((s) => s.pause);

  const [, force] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => force((n) => n + 1), 30_000);
    return () => window.clearInterval(id);
  }, []);

  const paused = pausedUntil && Date.now() < pausedUntil;

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-3 px-4 py-3 md:px-8 md:py-4">
      <div className="flex items-center gap-2 md:hidden">
        <div className="flex size-8 items-center justify-center rounded-lg bg-gradient-primary">
          <Activity className="size-4 text-primary-foreground" />
        </div>
        <span className="text-sm font-semibold">FocusPulse</span>
      </div>
      <div className="ml-auto flex items-center gap-2">
        <Button
          size="sm"
          variant={focusModeOn ? "default" : "outline"}
          onClick={toggleFocus}
          className="rounded-full"
        >
          <Focus className="size-4" />
          {focusModeOn ? "Focus On" : "Focus"}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" variant="outline" className="rounded-full">
              {paused ? <Play className="size-4" /> : <Pause className="size-4" />}
              {paused ? `Paused · ${formatRemaining(pausedUntil! - Date.now())}` : "Pause"}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="glass">
            <DropdownMenuLabel>Pause reminders</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => pause(15)}>15 minutes</DropdownMenuItem>
            <DropdownMenuItem onClick={() => pause(30)}>30 minutes</DropdownMenuItem>
            <DropdownMenuItem onClick={() => pause(60)}>1 hour</DropdownMenuItem>
            <DropdownMenuItem onClick={() => pause(180)}>3 hours</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => pause(null)} disabled={!paused}>
              Resume now
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};
