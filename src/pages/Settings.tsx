import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Droplet, Eye, Footprints, StretchHorizontal, Bell, RotateCcw } from "lucide-react";
import { useEngine } from "@/services/engine";
import { reminderLabel } from "@/services/messages";
import type { ReminderType } from "@/services/types";

const ICON: Record<ReminderType, typeof Droplet> = {
  water: Droplet,
  eyes: Eye,
  walk: Footprints,
  stretch: StretchHorizontal,
};

const ACCENT: Record<ReminderType, string> = {
  water: "bg-gradient-water",
  eyes: "bg-gradient-eyes",
  walk: "bg-gradient-walk",
  stretch: "bg-gradient-stretch",
};

export const Settings = () => {
  const settings = useEngine((s) => s.settings);
  const updateReminder = useEngine((s) => s.updateReminder);
  const setDesktopNotifications = useEngine((s) => s.setDesktopNotifications);
  const resetAllData = useEngine((s) => s.resetAllData);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Reminder settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Fine-tune each pulse. Changes apply instantly.
        </p>
      </div>

      <div className="grid gap-4">
        {(Object.keys(ICON) as ReminderType[]).map((type) => {
          const Icon = ICON[type];
          const cfg = settings.reminders[type];
          return (
            <Card key={type} className="glass-soft border-0">
              <CardContent className="p-5">
                <div className="flex items-center gap-4">
                  <div className={`flex size-11 items-center justify-center rounded-xl ${ACCENT[type]}`}>
                    <Icon className="size-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-base font-semibold">{reminderLabel[type]}</p>
                    <p className="text-xs text-muted-foreground">Every {cfg.intervalMin} minutes</p>
                  </div>
                  <Switch
                    checked={cfg.enabled}
                    onCheckedChange={(enabled) => updateReminder(type, { enabled })}
                  />
                </div>

                <div className="mt-5 space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                      Interval
                    </Label>
                    <span className="text-xs tabular-nums text-muted-foreground">
                      {cfg.intervalMin} min
                    </span>
                  </div>
                  <Slider
                    value={[cfg.intervalMin]}
                    min={5}
                    max={180}
                    step={5}
                    disabled={!cfg.enabled}
                    onValueChange={([v]) => updateReminder(type, { intervalMin: v })}
                  />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="glass-soft border-0">
        <CardContent className="flex items-center justify-between p-5">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-secondary">
              <Bell className="size-5" />
            </div>
            <div>
              <p className="text-sm font-semibold">Native desktop notifications</p>
              <p className="text-xs text-muted-foreground">
                Also fire system notifications alongside the overlay.
              </p>
            </div>
          </div>
          <Switch checked={settings.desktopNotifications} onCheckedChange={setDesktopNotifications} />
        </CardContent>
      </Card>

      <Card className="glass-soft border-0">
        <CardContent className="flex items-center justify-between p-5">
          <div>
            <p className="text-sm font-semibold">Reset everything</p>
            <p className="text-xs text-muted-foreground">
              Clear all settings, history and streaks on this device.
            </p>
          </div>
          <Button variant="outline" className="rounded-full" onClick={resetAllData}>
            <RotateCcw className="size-4" /> Reset
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
