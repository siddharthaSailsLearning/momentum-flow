export type ReminderKind = "water" | "eyes" | "walk" | "stretch" | "custom";

/** Built-in reminder kinds (used for default messages, gradients, icons). */
export type BuiltInKind = Exclude<ReminderKind, "custom">;

export interface ReminderItem {
  /** Stable identifier. For built-ins this equals the kind ("water" etc.).
   *  For custom reminders this is `custom-<uuid>`. */
  id: string;
  kind: ReminderKind;
  label: string;
  /** Single emoji shown in tiles & overlay. */
  emoji: string;
  /** Tailwind gradient class (e.g. "bg-gradient-water") OR an inline style hue applied via CSS var.
   *  Built-ins use the gradient classes; customs use a hue (degrees) we render with style. */
  gradient: string;
  /** Hue (0-360) for custom reminders; ignored for built-ins. */
  hue?: number;
  enabled: boolean;
  intervalMin: number;
  /** Optional custom message. If empty for built-ins we rotate from the message bank. */
  customMessage?: string;
}

export type Preset = "relaxed" | "balanced" | "hardcore";

export interface Settings {
  onboarded: boolean;
  preset: Preset;
  theme: "light" | "dark" | "system";
  overlayEffect: "bubbles" | "breath" | "lightning" | "sunlight";
  desktopNotifications: boolean;
  reminders: ReminderItem[];
  pausedUntil: number | null; // epoch ms
  focusModeOn: boolean;
}

export interface ReminderEvent {
  /** ID of the reminder that fired. */
  id: string;
  ts: number; // epoch ms
  completed: boolean;
}

export interface DayStats {
  date: string; // YYYY-MM-DD
  screenMinutes: number;
  /** Keyed by reminder ID. */
  byId: Record<string, { shown: number; completed: number }>;
}

const builtIn = (
  kind: BuiltInKind,
  label: string,
  emoji: string,
  intervalMin: number,
): ReminderItem => ({
  id: kind,
  kind,
  label,
  emoji,
  gradient: `bg-gradient-${kind}`,
  enabled: true,
  intervalMin,
});

const presetReminders = (intervals: Record<BuiltInKind, number>): ReminderItem[] => [
  builtIn("water", "Hydrate", "💧", intervals.water),
  builtIn("eyes", "Eye Rest", "👀", intervals.eyes),
  builtIn("walk", "Move", "🚶", intervals.walk),
  builtIn("stretch", "Stretch", "🧘", intervals.stretch),
];

export const PRESET_INTERVALS: Record<Preset, Record<BuiltInKind, number>> = {
  relaxed: { water: 60, eyes: 45, walk: 90, stretch: 90 },
  balanced: { water: 40, eyes: 25, walk: 60, stretch: 60 },
  hardcore: { water: 25, eyes: 20, walk: 40, stretch: 40 },
};

export const presetToReminders = (preset: Preset): ReminderItem[] =>
  presetReminders(PRESET_INTERVALS[preset]);

export const DEFAULT_SETTINGS: Settings = {
  onboarded: false,
  preset: "balanced",
  theme: "system",
  overlayEffect: "bubbles",
  desktopNotifications: true,
  reminders: presetToReminders("balanced"),
  pausedUntil: null,
  focusModeOn: false,
};

export const newCustomReminder = (overrides: Partial<ReminderItem> = {}): ReminderItem => ({
  id: `custom-${crypto.randomUUID().slice(0, 8)}`,
  kind: "custom",
  label: "New reminder",
  emoji: "✨",
  gradient: "",
  hue: 280,
  enabled: true,
  intervalMin: 30,
  customMessage: "Time for a mindful pause",
  ...overrides,
});
