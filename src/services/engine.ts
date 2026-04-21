import { create } from "zustand";
import { storage } from "@/lib/storage";
import {
  DEFAULT_SETTINGS,
  PRESET_INTERVALS,
  presetToReminders,
  type DayStats,
  type Preset,
  type ReminderEvent,
  type ReminderItem,
  type Settings,
} from "./types";

const SETTINGS_KEY = "settings";
const EVENTS_KEY = "events";
const STATS_KEY = "stats";
const SCHEDULE_KEY = "schedule";
const SESSION_START_KEY = "sessionStart";
const STREAK_KEY = "streak";

const todayKey = () => new Date().toISOString().slice(0, 10);

interface StreakInfo {
  current: number;
  best: number;
  lastDay: string | null;
}

interface EngineState {
  settings: Settings;
  events: ReminderEvent[];
  stats: DayStats[];
  streak: StreakInfo;
  /** next-fire epoch ms keyed by reminder id */
  schedule: Record<string, number>;
  sessionStart: number;
  /** id of currently displayed reminder, or null */
  pendingReminder: string | null;

  setPreset: (preset: Preset) => void;
  updateReminder: (id: string, patch: Partial<ReminderItem>) => void;
  addReminder: (reminder: ReminderItem) => void;
  removeReminder: (id: string) => void;
  setOverlayEffect: (effect: Settings["overlayEffect"]) => void;
  setTheme: (theme: Settings["theme"]) => void;
  setDesktopNotifications: (on: boolean) => void;
  pause: (minutes: number | null) => void;
  toggleFocusMode: () => void;
  completeOnboarding: () => void;
  resetAllData: () => void;

  triggerReminder: (id: string) => void;
  acknowledgeReminder: (completed: boolean) => void;
  tick: () => void;
}

const ensureToday = (stats: DayStats[]): DayStats[] => {
  const t = todayKey();
  if (stats.some((s) => s.date === t)) return stats;
  return [
    ...stats,
    {
      date: t,
      screenMinutes: 0,
      byId: {},
    },
  ].slice(-30);
};

const computeSchedule = (
  reminders: ReminderItem[],
  base = Date.now(),
): Record<string, number> => {
  const out: Record<string, number> = {};
  reminders.forEach((r) => {
    out[r.id] = r.enabled ? base + r.intervalMin * 60_000 : Number.MAX_SAFE_INTEGER;
  });
  return out;
};

const persistAll = (
  s: Pick<EngineState, "settings" | "events" | "stats" | "schedule" | "sessionStart" | "streak">,
) => {
  storage.set(SETTINGS_KEY, s.settings);
  storage.set(EVENTS_KEY, s.events.slice(-500));
  storage.set(STATS_KEY, s.stats);
  storage.set(SCHEDULE_KEY, s.schedule);
  storage.set(SESSION_START_KEY, s.sessionStart);
  storage.set(STREAK_KEY, s.streak);
};

/** Migrate legacy v1 shape (record-keyed reminders + byType stats) to v2 (list + byId). */
const migrateSettings = (raw: unknown): Settings => {
  if (!raw || typeof raw !== "object") return DEFAULT_SETTINGS;
  const obj = raw as Record<string, unknown>;
  if (Array.isArray(obj.reminders)) {
    return { ...DEFAULT_SETTINGS, ...(obj as Partial<Settings>) } as Settings;
  }
  // legacy: reminders was Record<ReminderType, ReminderConfig>
  const legacyReminders = obj.reminders as
    | Record<string, { enabled: boolean; intervalMin: number }>
    | undefined;
  const fresh = presetToReminders((obj.preset as Preset) ?? "balanced");
  if (legacyReminders) {
    fresh.forEach((r) => {
      const lr = legacyReminders[r.id];
      if (lr) {
        r.enabled = lr.enabled;
        r.intervalMin = lr.intervalMin;
      }
    });
  }
  return {
    ...DEFAULT_SETTINGS,
    ...(obj as Partial<Settings>),
    reminders: fresh,
  } as Settings;
};

const migrateStats = (raw: unknown): DayStats[] => {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((d): DayStats | null => {
      if (!d || typeof d !== "object") return null;
      const day = d as Record<string, unknown>;
      if (typeof day.date !== "string") return null;
      const screenMinutes = typeof day.screenMinutes === "number" ? day.screenMinutes : 0;
      if (day.byId && typeof day.byId === "object") {
        return { date: day.date, screenMinutes, byId: day.byId as DayStats["byId"] };
      }
      const byType = day.byType as Record<string, { shown: number; completed: number }> | undefined;
      const byId: DayStats["byId"] = {};
      if (byType) {
        Object.entries(byType).forEach(([k, v]) => {
          byId[k] = { shown: v.shown ?? 0, completed: v.completed ?? 0 };
        });
      }
      return { date: day.date, screenMinutes, byId };
    })
    .filter((x): x is DayStats => x !== null);
};

const migrateEvents = (raw: unknown): ReminderEvent[] => {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((e): ReminderEvent | null => {
      if (!e || typeof e !== "object") return null;
      const ev = e as Record<string, unknown>;
      const id = (ev.id as string | undefined) ?? (ev.type as string | undefined);
      if (!id || typeof ev.ts !== "number") return null;
      return { id, ts: ev.ts, completed: !!ev.completed };
    })
    .filter((x): x is ReminderEvent => x !== null);
};

const initialSettings = migrateSettings(storage.get<unknown>(SETTINGS_KEY, DEFAULT_SETTINGS));
const initialStats = ensureToday(migrateStats(storage.get<unknown>(STATS_KEY, [])));
const initialEvents = migrateEvents(storage.get<unknown>(EVENTS_KEY, []));
const initialSchedule = storage.get<Record<string, number>>(
  SCHEDULE_KEY,
  computeSchedule(initialSettings.reminders),
);
// Drop schedule entries for reminders that no longer exist
Object.keys(initialSchedule).forEach((id) => {
  if (!initialSettings.reminders.some((r) => r.id === id)) delete initialSchedule[id];
});
// Add missing reminders to schedule
initialSettings.reminders.forEach((r) => {
  if (!(r.id in initialSchedule)) {
    initialSchedule[r.id] = r.enabled
      ? Date.now() + r.intervalMin * 60_000
      : Number.MAX_SAFE_INTEGER;
  }
});
const initialSessionStart = storage.get<number>(SESSION_START_KEY, Date.now());
const initialStreak = storage.get<StreakInfo>(STREAK_KEY, { current: 0, best: 0, lastDay: null });

export const useEngine = create<EngineState>((set, get) => ({
  settings: initialSettings,
  events: initialEvents,
  stats: initialStats,
  streak: initialStreak,
  schedule: initialSchedule,
  sessionStart: initialSessionStart,
  pendingReminder: null,

  setPreset: (preset) => {
    // Apply preset intervals to existing built-ins; preserve customs and enabled state.
    const intervals = PRESET_INTERVALS[preset];
    const reminders = get().settings.reminders.map((r) =>
      r.kind === "custom" ? r : { ...r, intervalMin: intervals[r.kind] },
    );
    const settings = { ...get().settings, preset, reminders };
    const schedule = computeSchedule(reminders);
    set({ settings, schedule });
    persistAll({ ...get(), settings, schedule });
  },

  updateReminder: (id, patch) => {
    const reminders = get().settings.reminders.map((r) =>
      r.id === id ? { ...r, ...patch } : r,
    );
    const settings = { ...get().settings, reminders };
    const schedule = { ...get().schedule };
    const updated = reminders.find((r) => r.id === id);
    if (updated) {
      schedule[id] = updated.enabled
        ? Date.now() + updated.intervalMin * 60_000
        : Number.MAX_SAFE_INTEGER;
    }
    set({ settings, schedule });
    persistAll({ ...get(), settings, schedule });
  },

  addReminder: (reminder) => {
    const reminders = [...get().settings.reminders, reminder];
    const settings = { ...get().settings, reminders };
    const schedule = {
      ...get().schedule,
      [reminder.id]: reminder.enabled
        ? Date.now() + reminder.intervalMin * 60_000
        : Number.MAX_SAFE_INTEGER,
    };
    set({ settings, schedule });
    persistAll({ ...get(), settings, schedule });
  },

  removeReminder: (id) => {
    const reminders = get().settings.reminders.filter((r) => r.id !== id);
    const settings = { ...get().settings, reminders };
    const schedule = { ...get().schedule };
    delete schedule[id];
    set({ settings, schedule });
    persistAll({ ...get(), settings, schedule });
  },

  setOverlayEffect: (overlayEffect) => {
    const settings = { ...get().settings, overlayEffect };
    set({ settings });
    persistAll({ ...get(), settings });
  },

  setTheme: (theme) => {
    const settings = { ...get().settings, theme };
    set({ settings });
    persistAll({ ...get(), settings });
    applyTheme(theme);
  },

  setDesktopNotifications: (desktopNotifications) => {
    const settings = { ...get().settings, desktopNotifications };
    set({ settings });
    persistAll({ ...get(), settings });
    if (desktopNotifications && "Notification" in window && Notification.permission === "default") {
      Notification.requestPermission().catch(() => undefined);
    }
  },

  pause: (minutes) => {
    const pausedUntil = minutes ? Date.now() + minutes * 60_000 : null;
    const settings = { ...get().settings, pausedUntil };
    set({ settings });
    persistAll({ ...get(), settings });
  },

  toggleFocusMode: () => {
    const settings = { ...get().settings, focusModeOn: !get().settings.focusModeOn };
    set({ settings });
    persistAll({ ...get(), settings });
  },

  completeOnboarding: () => {
    const settings = { ...get().settings, onboarded: true };
    const sessionStart = Date.now();
    set({ settings, sessionStart });
    persistAll({ ...get(), settings, sessionStart });
  },

  resetAllData: () => {
    storage.remove(SETTINGS_KEY);
    storage.remove(EVENTS_KEY);
    storage.remove(STATS_KEY);
    storage.remove(SCHEDULE_KEY);
    storage.remove(SESSION_START_KEY);
    storage.remove(STREAK_KEY);
    const sessionStart = Date.now();
    set({
      settings: DEFAULT_SETTINGS,
      events: [],
      stats: ensureToday([]),
      streak: { current: 0, best: 0, lastDay: null },
      schedule: computeSchedule(DEFAULT_SETTINGS.reminders),
      sessionStart,
      pendingReminder: null,
    });
  },

  triggerReminder: (id) => {
    const reminder = get().settings.reminders.find((r) => r.id === id);
    if (!reminder) return;
    const stats = ensureToday(get().stats).map((day) => {
      if (day.date !== todayKey()) return day;
      const cur = day.byId[id] ?? { shown: 0, completed: 0 };
      return {
        ...day,
        byId: { ...day.byId, [id]: { ...cur, shown: cur.shown + 1 } },
      };
    });
    const schedule = {
      ...get().schedule,
      [id]: Date.now() + reminder.intervalMin * 60_000,
    };
    set({ pendingReminder: id, stats, schedule });
    persistAll({ ...get(), stats, schedule });
  },

  acknowledgeReminder: (completed) => {
    const id = get().pendingReminder;
    if (!id) return;
    const events = [...get().events, { id, ts: Date.now(), completed }];
    const stats = get().stats.map((day) => {
      if (day.date !== todayKey() || !completed) return day;
      const cur = day.byId[id] ?? { shown: 0, completed: 0 };
      return {
        ...day,
        byId: { ...day.byId, [id]: { ...cur, completed: cur.completed + 1 } },
      };
    });

    // streak update — completing at least one reminder counts the day
    const today = todayKey();
    let streak = get().streak;
    if (completed && streak.lastDay !== today) {
      const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
      const next = streak.lastDay === yesterday ? streak.current + 1 : 1;
      streak = { current: next, best: Math.max(streak.best, next), lastDay: today };
    }

    set({ events, stats, streak, pendingReminder: null });
    persistAll({ ...get(), events, stats, streak });
  },

  tick: () => {
    const { settings, schedule, sessionStart, stats, pendingReminder } = get();

    // accumulate screen minutes (1 minute per tick)
    const updatedStats = ensureToday(stats).map((day) =>
      day.date === todayKey()
        ? { ...day, screenMinutes: day.screenMinutes + 1 }
        : day,
    );
    set({ stats: updatedStats });
    storage.set(STATS_KEY, updatedStats);

    if (pendingReminder) return;
    if (settings.focusModeOn) return;
    if (settings.pausedUntil && Date.now() < settings.pausedUntil) return;
    if (settings.pausedUntil && Date.now() >= settings.pausedUntil) {
      const cleared = { ...settings, pausedUntil: null };
      set({ settings: cleared });
      storage.set(SETTINGS_KEY, cleared);
    }

    const now = Date.now();
    const enabledIds = new Set(settings.reminders.filter((r) => r.enabled).map((r) => r.id));
    const due = Object.entries(schedule)
      .filter(([id, t]) => enabledIds.has(id) && t <= now)
      .sort((a, b) => a[1] - b[1])[0];

    if (due) {
      get().triggerReminder(due[0]);
      void sessionStart;
    }
  },
}));

export const applyTheme = (theme: Settings["theme"]) => {
  const root = document.documentElement;
  const dark =
    theme === "dark" ||
    (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  root.classList.toggle("dark", dark);
};

export const nextReminder = (state: EngineState): { reminder: ReminderItem; at: number } | null => {
  const enabled = state.settings.reminders.filter((r) => r.enabled);
  if (!enabled.length) return null;
  const upcoming = enabled
    .map((r) => ({ reminder: r, at: state.schedule[r.id] ?? Number.MAX_SAFE_INTEGER }))
    .sort((a, b) => a.at - b.at)[0];
  return upcoming;
};

export const reminderById = (state: EngineState, id: string): ReminderItem | undefined =>
  state.settings.reminders.find((r) => r.id === id);

export const wellnessScore = (state: EngineState): number => {
  const today = state.stats.find((s) => s.date === todayKey());
  if (!today) return 100;
  let shown = 0;
  let completed = 0;
  Object.values(today.byId).forEach((v) => {
    shown += v.shown;
    completed += v.completed;
  });
  if (shown === 0) return 100;
  return Math.round((completed / shown) * 100);
};
