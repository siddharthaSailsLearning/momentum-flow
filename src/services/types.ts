export type ReminderType = "water" | "eyes" | "walk" | "stretch";

export interface ReminderConfig {
  enabled: boolean;
  intervalMin: number;
}

export type Preset = "relaxed" | "balanced" | "hardcore";

export interface Settings {
  onboarded: boolean;
  preset: Preset;
  theme: "light" | "dark" | "system";
  overlayEffect: "bubbles" | "breath" | "lightning" | "sunlight";
  desktopNotifications: boolean;
  reminders: Record<ReminderType, ReminderConfig>;
  pausedUntil: number | null; // epoch ms
  focusModeOn: boolean;
}

export interface ReminderEvent {
  type: ReminderType;
  ts: number; // epoch ms
  completed: boolean;
}

export interface DayStats {
  date: string; // YYYY-MM-DD
  screenMinutes: number;
  byType: Record<ReminderType, { shown: number; completed: number }>;
}

export const PRESETS: Record<Preset, Record<ReminderType, ReminderConfig>> = {
  relaxed: {
    water: { enabled: true, intervalMin: 60 },
    eyes: { enabled: true, intervalMin: 45 },
    walk: { enabled: true, intervalMin: 90 },
    stretch: { enabled: true, intervalMin: 90 },
  },
  balanced: {
    water: { enabled: true, intervalMin: 40 },
    eyes: { enabled: true, intervalMin: 25 },
    walk: { enabled: true, intervalMin: 60 },
    stretch: { enabled: true, intervalMin: 60 },
  },
  hardcore: {
    water: { enabled: true, intervalMin: 25 },
    eyes: { enabled: true, intervalMin: 20 },
    walk: { enabled: true, intervalMin: 40 },
    stretch: { enabled: true, intervalMin: 40 },
  },
};

export const DEFAULT_SETTINGS: Settings = {
  onboarded: false,
  preset: "balanced",
  theme: "system",
  overlayEffect: "bubbles",
  desktopNotifications: true,
  reminders: PRESETS.balanced,
  pausedUntil: null,
  focusModeOn: false,
};
