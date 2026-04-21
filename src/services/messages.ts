/**
 * Rotating reminder messages — friendly, varied, brand voice consistent.
 */
import type { ReminderType } from "./types";

const water = [
  "Time to hydrate 💧",
  "A glass of water awaits",
  "Sip, smile, refocus",
  "Hydration unlocks clarity",
  "Drink something cool",
  "Your brain runs on water",
  "Tiny sip, big reset",
  "Half a glass beats none",
  "Replenish & reset",
  "Stay liquid, stay sharp",
  "Hydrate like a pro",
  "Water break, champion",
  "Cells calling — refill",
  "Fresh water, fresh ideas",
  "One mindful sip",
];

const eyes = [
  "Blink and relax 👀",
  "Look 20 feet away for 20 seconds",
  "Soften your gaze",
  "Rest those pixels",
  "Find a distant horizon",
  "Eyes deserve a stretch",
  "Roll your eyes — it's healthy",
  "Window > Window (the OS one)",
  "Unfocus to refocus",
  "Give your retinas a vacation",
  "Look up, breathe in",
  "Distance = recovery",
  "Eye yoga time",
  "Blink slowly, ten times",
  "Far horizons heal",
];

const walk = [
  "Stand up, champion 🚶",
  "A few steps, big payoff",
  "Move the marvelous machine",
  "Stretch your legs",
  "Take a lap of victory",
  "Step away, come back wiser",
  "Walk equals fresh ideas",
  "Pace, ponder, prosper",
  "60 seconds upright",
  "Loosen those hips",
  "Quick stroll, slow breath",
  "Walk it out",
  "Movement is medicine",
  "Reset the spine",
  "Fuel up with motion",
];

const stretch = [
  "Stretch your shoulders 🧘",
  "Roll your neck — slowly",
  "Open your chest",
  "Reach for the ceiling",
  "Unwind the spine",
  "Loosen the jaw",
  "Wrist circles, ten each way",
  "Big breath, big stretch",
  "Melt the tension",
  "Twist gently, both sides",
  "Forward fold, slow exhale",
  "Calm body, clear mind",
  "Lengthen the side body",
  "Soft shoulders, soft mind",
  "Tiny stretch, huge relief",
];

const all: Record<ReminderType, string[]> = { water, eyes, walk, stretch };

export const reminderMessage = (type: ReminderType): string => {
  const list = all[type];
  return list[Math.floor(Math.random() * list.length)];
};

export const reminderEmoji: Record<ReminderType, string> = {
  water: "💧",
  eyes: "👀",
  walk: "🚶",
  stretch: "🧘",
};

export const reminderLabel: Record<ReminderType, string> = {
  water: "Hydrate",
  eyes: "Eye Rest",
  walk: "Move",
  stretch: "Stretch",
};

export const reminderGradient: Record<ReminderType, string> = {
  water: "bg-gradient-water",
  eyes: "bg-gradient-eyes",
  walk: "bg-gradient-walk",
  stretch: "bg-gradient-stretch",
};
