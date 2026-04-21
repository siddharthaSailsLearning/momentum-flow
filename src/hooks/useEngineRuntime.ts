import { useEffect } from "react";
import { useEngine, applyTheme, reminderById } from "@/services/engine";
import { messageForReminder } from "@/services/messages";

/**
 * Mounts global side-effects:
 * - schedule tick (every 60s)
 * - theme application + system listener
 * - native desktop notification on new reminder
 */
export const useEngineRuntime = () => {
  const tick = useEngine((s) => s.tick);
  const theme = useEngine((s) => s.settings.theme);
  const desktopNotifications = useEngine((s) => s.settings.desktopNotifications);
  const pendingReminder = useEngine((s) => s.pendingReminder);
  const reminder = useEngine((s) =>
    s.pendingReminder ? reminderById(s, s.pendingReminder) : undefined,
  );

  // tick every 60s; first tick after 2s so app can render
  useEffect(() => {
    const first = window.setTimeout(tick, 2_000);
    const id = window.setInterval(tick, 60_000);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(id);
    };
  }, [tick]);

  // theme
  useEffect(() => {
    applyTheme(theme);
    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => applyTheme("system");
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [theme]);

  // desktop notification
  useEffect(() => {
    if (!pendingReminder || !reminder) return;
    if (!desktopNotifications) return;
    if (!("Notification" in window)) return;
    if (Notification.permission !== "granted") return;
    try {
      new Notification(`FocusPulse — ${reminder.label}`, {
        body: messageForReminder(reminder),
        silent: false,
      });
    } catch {
      /* ignore */
    }
  }, [pendingReminder, reminder, desktopNotifications]);
};
