import { create } from "zustand";
import { storage } from "@/lib/storage";
import {
  DEFAULT_SETTINGS,
  PRESETS,
  type DayStats,
  type Preset,
  type ReminderConfig,
  type ReminderEvent,
  type ReminderType,
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
  schedule: Record<ReminderType, number>; // next-fire epoch ms
  sessionStart: number;
  pendingReminder: ReminderType | null;

  setPreset: (preset: Preset) => void;
  updateReminder: (type: ReminderType, patch: Partial<ReminderConfig>) => void;
  setOverlayEffect: (effect: Settings["overlayEffect"]) => void;
  setTheme: (theme: Settings["theme"]) => void;
  setDesktopNotifications: (on: boolean) => void;
  pause: (minutes: number | null) => void;
  toggleFocusMode: () => void;
  completeOnboarding: () => void;
  resetAllData: () => void;

  triggerReminder: (type: ReminderType) => void;
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
      byType: {
        water: { shown: 0, completed: 0 },
        eyes: { shown: 0, completed: 0 },
        walk: { shown: 0, completed: 0 },
        stretch: { shown: 0, completed: 0 },
      },
    },
  ].slice(-30);
};

const computeSchedule = (
  reminders: Settings["reminders"],
  base = Date.now(),
): Record<ReminderType, number> => ({
  water: reminders.water.enabled ? base + reminders.water.intervalMin * 60_000 : Number.MAX_SAFE_INTEGER,
  eyes: reminders.eyes.enabled ? base + reminders.eyes.intervalMin * 60_000 : Number.MAX_SAFE_INTEGER,
  walk: reminders.walk.enabled ? base + reminders.walk.intervalMin * 60_000 : Number.MAX_SAFE_INTEGER,
  stretch: reminders.stretch.enabled ? base + reminders.stretch.intervalMin * 60_000 : Number.MAX_SAFE_INTEGER,
});

const persistAll = (s: Pick<EngineState, "settings" | "events" | "stats" | "schedule" | "sessionStart" | "streak">) => {
  storage.set(SETTINGS_KEY, s.settings);
  storage.set(EVENTS_KEY, s.events.slice(-500));
  storage.set(STATS_KEY, s.stats);
  storage.set(SCHEDULE_KEY, s.schedule);
  storage.set(SESSION_START_KEY, s.sessionStart);
  storage.set(STREAK_KEY, s.streak);
};

const initialSettings = storage.get<Settings>(SETTINGS_KEY, DEFAULT_SETTINGS);
const initialStats = ensureToday(storage.get<DayStats[]>(STATS_KEY, []));
const initialSchedule = storage.get<Record<ReminderType, number>>(
  SCHEDULE_KEY,
  computeSchedule(initialSettings.reminders),
);
const initialSessionStart = storage.get<number>(SESSION_START_KEY, Date.now());
const initialStreak = storage.get<StreakInfo>(STREAK_KEY, { current: 0, best: 0, lastDay: null });

export const useEngine = create<EngineState>((set, get) => ({
  settings: initialSettings,
  events: storage.get<ReminderEvent[]>(EVENTS_KEY, []),
  stats: initialStats,
  streak: initialStreak,
  schedule: initialSchedule,
  sessionStart: initialSessionStart,
  pendingReminder: null,

  setPreset: (preset) => {
    const reminders = PRESETS[preset];
    const settings = { ...get().settings, preset, reminders };
    const schedule = computeSchedule(reminders);
    set({ settings, schedule });
    persistAll({ ...get(), settings, schedule });
  },

  updateReminder: (type, patch) => {
    const reminders = {
      ...get().settings.reminders,
      [type]: { ...get().settings.reminders[type], ...patch },
    };
    const settings = { ...get().settings, reminders, preset: get().settings.preset };
    const schedule = { ...get().schedule };
    schedule[type] = reminders[type].enabled
      ? Date.now() + reminders[type].intervalMin * 60_000
      : Number.MAX_SAFE_INTEGER;
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

  triggerReminder: (type) => {
    const stats = ensureToday(get().stats).map((day) =>
      day.date === todayKey()
        ? {
            ...day,
            byType: {
              ...day.byType,
              [type]: { ...day.byType[type], shown: day.byType[type].shown + 1 },
            },
          }
        : day,
    );
    const schedule = {
      ...get().schedule,
      [type]: Date.now() + get().settings.reminders[type].intervalMin * 60_000,
    };
    set({ pendingReminder: type, stats, schedule });
    persistAll({ ...get(), stats, schedule });
  },

  acknowledgeReminder: (completed) => {
    const type = get().pendingReminder;
    if (!type) return;
    const events = [...get().events, { type, ts: Date.now(), completed }];
    const stats = get().stats.map((day) =>
      day.date === todayKey() && completed
        ? {
            ...day,
            byType: {
              ...day.byType,
              [type]: { ...day.byType[type], completed: day.byType[type].completed + 1 },
            },
          }
        : day,
    );

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
    const due = (Object.entries(schedule) as [ReminderType, number][])
      .filter(([type, t]) => settings.reminders[type].enabled && t <= now)
      .sort((a, b) => a[1] - b[1])[0];

    if (due) {
      get().triggerReminder(due[0]);
      // session length informs next reminder copy in dashboard, no further action
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

export const nextReminder = (state: EngineState): { type: ReminderType; at: number } | null => {
  const entries = (Object.entries(state.schedule) as [ReminderType, number][]).filter(
    ([type]) => state.settings.reminders[type].enabled,
  );
  if (!entries.length) return null;
  const [type, at] = entries.sort((a, b) => a[1] - b[1])[0];
  return { type, at };
};

export const wellnessScore = (state: EngineState): number => {
  const today = state.stats.find((s) => s.date === todayKey());
  if (!today) return 0;
  let shown = 0;
  let completed = 0;
  (Object.values(today.byType) as { shown: number; completed: number }[]).forEach((v) => {
    shown += v.shown;
    completed += v.completed;
  });
  if (shown === 0) return 100;
  return Math.round((completed / shown) * 100);
};
