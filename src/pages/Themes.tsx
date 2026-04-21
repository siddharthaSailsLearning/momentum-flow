import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Moon, Sun, MonitorSmartphone, Sparkles } from "lucide-react";
import { useEngine } from "@/services/engine";
import type { Settings as SettingsT } from "@/services/types";
import { cn } from "@/lib/utils";

const themes: { value: SettingsT["theme"]; label: string; icon: typeof Sun }[] = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: MonitorSmartphone },
];

const effects: { value: SettingsT["overlayEffect"]; label: string; gradient: string; description: string }[] = [
  { value: "bubbles", label: "Soft bubbles", gradient: "bg-gradient-water", description: "Floating water orbs" },
  { value: "breath", label: "Breathing", gradient: "bg-gradient-walk", description: "Calming pulse rings" },
  { value: "lightning", label: "Edge glow", gradient: "bg-gradient-eyes", description: "Shimmering borders" },
  { value: "sunlight", label: "Sunlight", gradient: "bg-gradient-stretch", description: "Warm radial glow" },
];

export const Themes = () => {
  const settings = useEngine((s) => s.settings);
  const setTheme = useEngine((s) => s.setTheme);
  const setOverlayEffect = useEngine((s) => s.setOverlayEffect);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Appearance</h1>
        <p className="mt-1 text-sm text-muted-foreground">Tune how FocusPulse looks and feels.</p>
      </div>

      <Card className="glass-soft border-0">
        <CardContent className="p-5">
          <p className="mb-4 text-sm font-semibold">Theme</p>
          <div className="grid grid-cols-3 gap-3">
            {themes.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                onClick={() => setTheme(value)}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-2xl border p-4 text-sm transition-all",
                  settings.theme === value
                    ? "border-primary bg-primary/5 shadow-soft"
                    : "border-border bg-background/50 hover:bg-secondary",
                )}
              >
                <Icon className="size-5" />
                <span className="font-medium">{label}</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="glass-soft border-0">
        <CardContent className="p-5">
          <p className="mb-4 text-sm font-semibold">Overlay effect</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {effects.map(({ value, label, gradient, description }) => (
              <button
                key={value}
                onClick={() => setOverlayEffect(value)}
                className={cn(
                  "group relative flex items-center gap-4 overflow-hidden rounded-2xl border p-4 text-left transition-all",
                  settings.overlayEffect === value
                    ? "border-primary shadow-soft"
                    : "border-border hover:border-primary/40",
                )}
              >
                <div className={cn("size-14 rounded-xl shadow-soft", gradient)} />
                <div className="flex-1">
                  <p className="text-sm font-semibold">{label}</p>
                  <p className="text-xs text-muted-foreground">{description}</p>
                </div>
                {settings.overlayEffect === value && (
                  <Sparkles className="size-4 text-primary" />
                )}
              </button>
            ))}
          </div>
          <PreviewButton />
        </CardContent>
      </Card>
    </div>
  );
};

const PreviewButton = () => {
  const reminders = useEngine((s) => s.settings.reminders);
  const trigger = useEngine((s) => s.triggerReminder);
  const first = reminders.find((r) => r.enabled) ?? reminders[0];
  return (
    <div className="mt-5 flex justify-end">
      <Button
        variant="outline"
        className="rounded-full"
        disabled={!first}
        onClick={() => first && trigger(first.id)}
      >
        Preview overlay
      </Button>
    </div>
  );
};
