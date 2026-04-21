import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useMemo } from "react";
import { useEngine } from "@/services/engine";
import { reminderEmoji, reminderGradient, reminderLabel, reminderMessage } from "@/services/messages";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";

const OVERLAY_DURATION_MS = 10_000;

const Bubbles = () => (
  <div className="pointer-events-none absolute inset-0 overflow-hidden">
    {Array.from({ length: 18 }).map((_, i) => {
      const size = 14 + Math.random() * 36;
      const left = Math.random() * 100;
      const delay = Math.random() * 4;
      const duration = 6 + Math.random() * 4;
      return (
        <span
          key={i}
          className="absolute bottom-[-60px] rounded-full border border-white/40 bg-white/20 backdrop-blur-sm"
          style={{
            width: size,
            height: size,
            left: `${left}%`,
            animation: `float-up ${duration}s ${delay}s linear infinite`,
          }}
        />
      );
    })}
  </div>
);

const BreathRing = () => (
  <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
    <div className="h-[60vmin] w-[60vmin] rounded-full border-2 border-white/40 animate-breath" />
    <div className="absolute h-[40vmin] w-[40vmin] rounded-full border border-white/30 animate-breath [animation-delay:1s]" />
  </div>
);

const Lightning = () => (
  <div className="pointer-events-none absolute inset-0">
    <div className="absolute inset-x-8 top-8 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent animate-shimmer [background-size:200%_100%]" />
    <div className="absolute inset-x-8 bottom-8 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent animate-shimmer [background-size:200%_100%]" />
    <div className="absolute inset-y-8 left-8 w-px bg-gradient-to-b from-transparent via-white/70 to-transparent animate-shimmer [background-size:100%_200%]" />
    <div className="absolute inset-y-8 right-8 w-px bg-gradient-to-b from-transparent via-white/70 to-transparent animate-shimmer [background-size:100%_200%]" />
  </div>
);

const Sunlight = () => (
  <div className="pointer-events-none absolute inset-0">
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,hsl(45_100%_70%/0.35),transparent_60%)] animate-breath" />
    <div className="absolute inset-0 bg-[conic-gradient(from_0deg,transparent,hsl(45_100%_80%/0.18),transparent_30%)] animate-[spin_18s_linear_infinite]" />
  </div>
);

export const ReminderOverlay = () => {
  const pending = useEngine((s) => s.pendingReminder);
  const acknowledge = useEngine((s) => s.acknowledgeReminder);
  const effect = useEngine((s) => s.settings.overlayEffect);

  const message = useMemo(() => (pending ? reminderMessage(pending) : ""), [pending]);

  // auto-dismiss after 10s as completed
  useEffect(() => {
    if (!pending) return;
    const id = window.setTimeout(() => acknowledge(true), OVERLAY_DURATION_MS);
    return () => window.clearTimeout(id);
  }, [pending, acknowledge]);

  // Esc dismisses (snoozed = not completed)
  useEffect(() => {
    if (!pending) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") acknowledge(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [pending, acknowledge]);

  return (
    <AnimatePresence>
      {pending && (
        <motion.div
          key="overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-0 z-[200] flex items-center justify-center"
        >
          {/* layered background: branded gradient + frosted glass */}
          <div className={`absolute inset-0 ${reminderGradient[pending]} opacity-90`} />
          <div className="absolute inset-0 backdrop-blur-2xl bg-background/30" />

          {/* effect layer */}
          {effect === "bubbles" && <Bubbles />}
          {effect === "breath" && <BreathRing />}
          {effect === "lightning" && <Lightning />}
          {effect === "sunlight" && <Sunlight />}

          {/* central card */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 16 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="glass relative z-10 mx-6 max-w-lg rounded-3xl px-10 py-12 text-center shadow-glow"
          >
            <div className="mb-6 text-7xl drop-shadow-sm" aria-hidden>
              {reminderEmoji[pending]}
            </div>
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">
              {reminderLabel[pending]}
            </p>
            <h2 className="mt-3 text-3xl font-semibold leading-tight text-foreground sm:text-4xl">
              {message}
            </h2>
            <p className="mt-4 text-sm text-muted-foreground">
              This card fades out automatically in 10 seconds.
            </p>

            <div className="mt-8 flex items-center justify-center gap-3">
              <Button
                size="lg"
                onClick={() => acknowledge(true)}
                className="rounded-full bg-foreground text-background hover:bg-foreground/90"
              >
                <Check className="size-4" /> Done
              </Button>
              <Button
                size="lg"
                variant="ghost"
                onClick={() => acknowledge(false)}
                className="rounded-full"
              >
                <X className="size-4" /> Skip
              </Button>
            </div>

            {/* progress bar */}
            <motion.div
              key={pending}
              initial={{ scaleX: 1 }}
              animate={{ scaleX: 0 }}
              transition={{ duration: OVERLAY_DURATION_MS / 1000, ease: "linear" }}
              className="absolute inset-x-0 bottom-0 h-1 origin-right rounded-b-3xl bg-foreground/40"
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
