import { useState } from "react";
import { motion } from "framer-motion";
import { Activity, ArrowRight, Droplet, Eye, Footprints, ShieldCheck, StretchHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEngine } from "@/services/engine";
import type { Preset } from "@/services/types";
import { cn } from "@/lib/utils";

const PRESET_OPTIONS: { value: Preset; label: string; description: string }[] = [
  { value: "relaxed", label: "Relaxed", description: "Light nudges, longer intervals." },
  { value: "balanced", label: "Balanced", description: "Recommended for most workdays." },
  { value: "hardcore", label: "Hardcore", description: "Frequent, disciplined breaks." },
];

const FEATURES = [
  { icon: Droplet, label: "Hydrate" },
  { icon: Eye, label: "Eye rest" },
  { icon: Footprints, label: "Move" },
  { icon: StretchHorizontal, label: "Stretch" },
];

export const Onboarding = () => {
  const [step, setStep] = useState(0);
  const [preset, setPreset] = useState<Preset>("balanced");
  const setEnginePreset = useEngine((s) => s.setPreset);
  const completeOnboarding = useEngine((s) => s.completeOnboarding);
  const setDesktopNotifications = useEngine((s) => s.setDesktopNotifications);

  const finish = () => {
    setEnginePreset(preset);
    setDesktopNotifications(true);
    completeOnboarding();
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="glass w-full max-w-xl rounded-3xl p-8 shadow-glass md:p-10"
      >
        <div className="mb-6 flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-primary shadow-glow">
            <Activity className="size-5 text-primary-foreground" />
          </div>
          <div>
            <p className="text-sm font-semibold leading-tight">FocusPulse</p>
            <p className="text-xs text-muted-foreground">Step {step + 1} of 3</p>
          </div>
        </div>

        {step === 0 && (
          <div>
            <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
              Tiny breaks. <span className="text-gradient">Big focus.</span>
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              FocusPulse gently reminds you to hydrate, rest your eyes, move and stretch — so you
              can stay sharp through long screen days.
            </p>
            <div className="mt-6 grid grid-cols-4 gap-3">
              {FEATURES.map(({ icon: Icon, label }) => (
                <div key={label} className="glass-soft flex flex-col items-center gap-2 rounded-2xl p-4">
                  <Icon className="size-5" />
                  <p className="text-[11px] font-medium text-muted-foreground">{label}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 1 && (
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Pick your pace</h2>
            <p className="mt-2 text-sm text-muted-foreground">You can change this anytime.</p>
            <div className="mt-5 space-y-2">
              {PRESET_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setPreset(opt.value)}
                  className={cn(
                    "w-full rounded-2xl border p-4 text-left transition-all",
                    preset === opt.value
                      ? "border-primary bg-primary/5 shadow-soft"
                      : "border-border hover:border-primary/40",
                  )}
                >
                  <p className="text-sm font-semibold">{opt.label}</p>
                  <p className="text-xs text-muted-foreground">{opt.description}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Private by default</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              No accounts, no tracking. Your data lives only on this device.
            </p>
            <div className="glass-soft mt-5 flex items-start gap-3 rounded-2xl p-4">
              <ShieldCheck className="mt-0.5 size-5 text-primary" />
              <p className="text-sm text-muted-foreground">
                We'll ask for permission to send native desktop notifications when a reminder is
                due. You can disable this anytime in Reminders.
              </p>
            </div>
          </div>
        )}

        <div className="mt-8 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            className="rounded-full"
          >
            Back
          </Button>
          {step < 2 ? (
            <Button onClick={() => setStep((s) => s + 1)} className="rounded-full">
              Continue <ArrowRight className="size-4" />
            </Button>
          ) : (
            <Button onClick={finish} className="rounded-full bg-gradient-primary text-primary-foreground shadow-glow">
              Start FocusPulse <ArrowRight className="size-4" />
            </Button>
          )}
        </div>
      </motion.div>
    </div>
  );
};
