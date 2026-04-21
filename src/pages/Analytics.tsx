import { Card, CardContent } from "@/components/ui/card";
import { useEngine } from "@/services/engine";
import { builtInGradient, customGradientStyle } from "@/services/messages";
import { cn } from "@/lib/utils";

export const Analytics = () => {
  const stats = useEngine((s) => s.stats);
  const reminders = useEngine((s) => s.settings.reminders);
  const last7 = stats.slice(-7);

  const aggregate = (id: string) => {
    let shown = 0;
    let completed = 0;
    last7.forEach((d) => {
      const v = d.byId[id];
      if (v) {
        shown += v.shown;
        completed += v.completed;
      }
    });
    return { shown, completed };
  };

  let totalShown = 0;
  let totalCompleted = 0;
  reminders.forEach((r) => {
    const a = aggregate(r.id);
    totalShown += a.shown;
    totalCompleted += a.completed;
  });

  const adherence = totalShown ? Math.round((totalCompleted / totalShown) * 100) : 0;
  const avgScreen =
    last7.length === 0 ? 0 : Math.round(last7.reduce((a, d) => a + d.screenMinutes, 0) / last7.length);

  const maxMinutes = Math.max(60, ...last7.map((d) => d.screenMinutes));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Analytics</h1>
        <p className="mt-1 text-sm text-muted-foreground">Last 7 days, on this device only.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="glass-soft border-0">
          <CardContent className="p-5">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Adherence</p>
            <p className="mt-1 text-3xl font-semibold">{adherence}%</p>
            <p className="text-xs text-muted-foreground">{totalCompleted}/{totalShown} pulses honored</p>
          </CardContent>
        </Card>
        <Card className="glass-soft border-0">
          <CardContent className="p-5">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Avg screen time</p>
            <p className="mt-1 text-3xl font-semibold">
              {Math.floor(avgScreen / 60)}h {avgScreen % 60}m
            </p>
            <p className="text-xs text-muted-foreground">per day, last 7 days</p>
          </CardContent>
        </Card>
        <Card className="glass-soft border-0">
          <CardContent className="p-5">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Pulses honored</p>
            <p className="mt-1 text-3xl font-semibold">{totalCompleted}</p>
            <p className="text-xs text-muted-foreground">across all categories</p>
          </CardContent>
        </Card>
      </div>

      <Card className="glass-soft border-0">
        <CardContent className="p-5">
          <p className="mb-4 text-sm font-semibold">Daily screen time</p>
          <div className="flex h-40 items-end gap-2">
            {last7.length === 0 && <p className="text-sm text-muted-foreground">No data yet.</p>}
            {last7.map((d) => {
              const h = Math.max(4, (d.screenMinutes / maxMinutes) * 100);
              return (
                <div key={d.date} className="flex flex-1 flex-col items-center gap-2">
                  <div className="flex w-full flex-1 items-end">
                    <div
                      className="w-full rounded-t-md bg-gradient-primary transition-all"
                      style={{ height: `${h}%` }}
                    />
                  </div>
                  <p className="text-[10px] tabular-nums text-muted-foreground">
                    {d.date.slice(5)}
                  </p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card className="glass-soft border-0">
        <CardContent className="p-5">
          <p className="mb-4 text-sm font-semibold">By reminder (last 7 days)</p>
          {reminders.length === 0 ? (
            <p className="text-sm text-muted-foreground">No reminders configured.</p>
          ) : (
            <div className="space-y-3">
              {reminders.map((r) => {
                const { shown, completed } = aggregate(r.id);
                const pct = shown ? Math.round((completed / shown) * 100) : 0;
                const isBuiltIn = r.kind !== "custom";
                const barClass = isBuiltIn ? builtInGradient[r.kind as Exclude<typeof r.kind, "custom">] : "";
                const barStyle = !isBuiltIn ? customGradientStyle(r.hue ?? 280) : undefined;
                return (
                  <div key={r.id}>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="font-medium">
                        <span aria-hidden className="mr-1">{r.emoji}</span>
                        {r.label}
                      </span>
                      <span className="tabular-nums text-muted-foreground">
                        {completed}/{shown} · {pct}%
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-secondary">
                      <div
                        className={cn("h-full rounded-full", barClass)}
                        style={{ width: `${pct}%`, ...barStyle }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
