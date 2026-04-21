import { useEffect, useState } from "react";
import { Activity, Droplet, Eye, Flame, Footprints, StretchHorizontal, Trophy } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useEngine, nextReminder, wellnessScore } from "@/services/engine";
import { reminderLabel } from "@/services/messages";
import type { Preset, ReminderType } from "@/services/types";
import { cn } from "@/lib/utils";

const TYPE_ICON: Record<ReminderType, typeof Droplet> = {
  water: Droplet,
  eyes: Eye,
  walk: Footprints,
  stretch: StretchHorizontal,
};

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
  const waterCompleted = today?.byType.water.completed ?? 0;

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
                  {reminderLabel[next.type]} in
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
          icon={Droplet}
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
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {(Object.keys(TYPE_ICON) as ReminderType[]).map((type) => {
            const Icon = TYPE_ICON[type];
            const stats = today?.byType[type];
            const interval = state.settings.reminders[type].intervalMin;
            return (
              <Card key={type} className="glass-soft border-0">
                <CardContent className="p-5">
                  <div className="mb-4 flex size-10 items-center justify-center rounded-xl bg-secondary">
                    <Icon className="size-5" />
                  </div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">{reminderLabel[type]}</p>
                  <p className="mt-1 text-2xl font-semibold">{stats?.completed ?? 0}</p>
                  <p className="text-xs text-muted-foreground">every {interval}m · {stats?.shown ?? 0} shown</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      <Card className="glass-soft border-0">
        <CardContent className="flex flex-col items-start gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold">Try a pulse right now</p>
            <p className="text-xs text-muted-foreground">Preview the overlay for any reminder type.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(TYPE_ICON) as ReminderType[]).map((t) => (
              <Button key={t} size="sm" variant="outline" className="rounded-full" onClick={() => state.triggerReminder(t)}>
                {reminderLabel[t]}
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
  label,
  value,
  sub,
  accent,
}: {
  icon: typeof Droplet;
  label: string;
  value: string;
  sub?: string;
  accent?: string;
}) => (
  <Card className="glass-soft border-0">
    <CardContent className="p-5">
      <div className={cn("mb-4 flex size-10 items-center justify-center rounded-xl", accent ?? "bg-secondary")}>
        <Icon className={cn("size-5", accent ? "text-white" : "")} />
      </div>
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </CardContent>
  </Card>
);
