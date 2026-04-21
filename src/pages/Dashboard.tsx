import { useEffect, useState } from "react";
import { Activity, Flame, Trophy } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useEngine, nextReminder, wellnessScore } from "@/services/engine";
import { builtInGradient, customGradientStyle } from "@/services/messages";
import type { Preset, ReminderItem } from "@/services/types";
import { cn } from "@/lib/utils";

const formatCountdown = (ms: number) => {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
};

const todayKey = () => new Date().toISOString().slice(0, 10);

const PresetButton = ({
  value,
  current,
  label,
  onClick,
}: {
  value: Preset;
  current: Preset;
  label: string;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className={cn(
      "flex-1 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
      current === value
        ? "bg-foreground text-background shadow-soft"
        : "text-muted-foreground hover:bg-secondary",
    )}
  >
    {label}
  </button>
);

const tileSurface = (r: ReminderItem) => {
  if (r.kind === "custom") {
    return { className: "", style: customGradientStyle(r.hue ?? 280) };
  }
  return { className: builtInGradient[r.kind], style: undefined as React.CSSProperties | undefined };
};

export const Dashboard = () => {
  const state = useEngine();
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const today = state.stats.find((s) => s.date === todayKey());
  const next = nextReminder(state);
  const score = wellnessScore(state);
  const waterCompleted = today?.byId.water?.completed ?? 0;

  return (
    <div className="space-y-6">
      {/* hero */}
      <Card className="glass overflow-hidden border-0 shadow-glass">
        <CardContent className="relative p-8">
          <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-gradient-primary opacity-30 blur-3xl" />
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Good day
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight md:text-4xl">
            Your <span className="text-gradient">next pulse</span>
          </h1>
          {next ? (
            <div className="mt-6 flex items-end gap-4">
              <div>
                <p className="text-xs text-muted-foreground">
                  {next.reminder.label} in
                </p>
                <p className="text-5xl font-bold tabular-nums tracking-tight md:text-6xl">
                  {formatCountdown(next.at - now)}
                </p>
              </div>
              <p className="mb-2 text-sm text-muted-foreground">minutes</p>
            </div>
          ) : (
            <p className="mt-6 text-muted-foreground">All reminders are off — enable some in Reminders.</p>
          )}

          <div className="mt-6 flex flex-wrap gap-2">
            <PresetButton value="relaxed" current={state.settings.preset} label="Relaxed" onClick={() => state.setPreset("relaxed")} />
            <PresetButton value="balanced" current={state.settings.preset} label="Balanced" onClick={() => state.setPreset("balanced")} />
            <PresetButton value="hardcore" current={state.settings.preset} label="Hardcore" onClick={() => state.setPreset("hardcore")} />
          </div>
        </CardContent>
      </Card>

      {/* stat row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Activity}
          label="Screen time today"
          value={`${Math.floor((today?.screenMinutes ?? 0) / 60)}h ${(today?.screenMinutes ?? 0) % 60}m`}
        />
        <StatCard
          emoji="💧"
          label="Hydration breaks"
          value={`${waterCompleted}`}
          accent="bg-gradient-water"
        />
        <StatCard
          icon={Flame}
          label="Wellness score"
          value={`${score}%`}
          accent="bg-gradient-primary"
        />
        <StatCard
          icon={Trophy}
          label="Streak"
          value={`${state.streak.current}d`}
          sub={`Best ${state.streak.best}d`}
        />
      </div>

      {/* per-type tiles */}
      <div>
        <h2 className="mb-3 px-1 text-sm font-semibold text-muted-foreground">Today's pulses</h2>
        {state.settings.reminders.length === 0 ? (
          <Card className="glass-soft border-0">
            <CardContent className="p-6 text-center text-sm text-muted-foreground">
              No reminders yet. Add one from <span className="font-medium text-foreground">Reminders</span>.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {state.settings.reminders.map((r) => {
              const stats = today?.byId[r.id];
              const surf = tileSurface(r);
              return (
                <Card key={r.id} className="glass-soft border-0">
                  <CardContent className="p-5">
                    <div
                      className={cn("mb-4 flex size-10 items-center justify-center rounded-xl text-lg", surf.className || "bg-secondary")}
                      style={surf.style}
                    >
                      <span aria-hidden>{r.emoji}</span>
                    </div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">{r.label}</p>
                    <p className="mt-1 text-2xl font-semibold">{stats?.completed ?? 0}</p>
                    <p className="text-xs text-muted-foreground">
                      every {r.intervalMin}m · {stats?.shown ?? 0} shown
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <Card className="glass-soft border-0">
        <CardContent className="flex flex-col items-start gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold">Try a pulse right now</p>
            <p className="text-xs text-muted-foreground">Preview the overlay for any reminder.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {state.settings.reminders.map((r) => (
              <Button key={r.id} size="sm" variant="outline" className="rounded-full" onClick={() => state.triggerReminder(r.id)}>
                <span aria-hidden>{r.emoji}</span> {r.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const StatCard = ({
  icon: Icon,
  emoji,
  label,
  value,
  sub,
  accent,
}: {
  icon?: typeof Activity;
  emoji?: string;
  label: string;
  value: string;
  sub?: string;
  accent?: string;
}) => (
  <Card className="glass-soft border-0">
    <CardContent className="p-5">
      <div className={cn("mb-4 flex size-10 items-center justify-center rounded-xl", accent ?? "bg-secondary")}>
        {Icon ? (
          <Icon className={cn("size-5", accent ? "text-white" : "")} />
        ) : (
          <span className="text-lg" aria-hidden>{emoji}</span>
        )}
      </div>
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </CardContent>
  </Card>
);
