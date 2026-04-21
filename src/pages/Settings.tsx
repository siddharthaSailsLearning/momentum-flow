import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Bell, Pencil, Plus, Play, RotateCcw, Trash2 } from "lucide-react";
import { useEngine } from "@/services/engine";
import { builtInGradient, customGradientStyle } from "@/services/messages";
import { newCustomReminder, type ReminderItem } from "@/services/types";
import { cn } from "@/lib/utils";

const EMOJI_PALETTE = [
  "💧", "👀", "🚶", "🧘", "✨", "☕", "🍎", "🌿", "🧠", "💪",
  "📞", "📚", "🎵", "🌬️", "🌅", "🛏️", "🧴", "💊", "🪟", "🦷",
];

interface ReminderRowProps {
  reminder: ReminderItem;
  onToggle: (enabled: boolean) => void;
  onIntervalChange: (intervalMin: number) => void;
  onEdit: () => void;
  onDelete: () => void;
  onPreview: () => void;
}

const ReminderRow = ({ reminder, onToggle, onIntervalChange, onEdit, onDelete, onPreview }: ReminderRowProps) => {
  const isBuiltIn = reminder.kind !== "custom";
  const tileClass = isBuiltIn
    ? builtInGradient[reminder.kind as Exclude<typeof reminder.kind, "custom">]
    : "";
  const tileStyle = !isBuiltIn ? customGradientStyle(reminder.hue ?? 280) : undefined;

  return (
    <Card className="glass-soft border-0">
      <CardContent className="p-5">
        <div className="flex items-center gap-4">
          <div
            className={cn("flex size-11 items-center justify-center rounded-xl text-xl", tileClass || "bg-secondary")}
            style={tileStyle}
            aria-hidden
          >
            {reminder.emoji}
          </div>
          <div className="flex-1 min-w-0">
            <p className="truncate text-base font-semibold">{reminder.label}</p>
            <p className="truncate text-xs text-muted-foreground">
              {reminder.kind === "custom" ? "Custom" : "Built-in"} · every {reminder.intervalMin} min
            </p>
          </div>
          <Switch checked={reminder.enabled} onCheckedChange={onToggle} />
        </div>

        <div className="mt-5 space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Interval</Label>
            <span className="text-xs tabular-nums text-muted-foreground">{reminder.intervalMin} min</span>
          </div>
          <Slider
            value={[reminder.intervalMin]}
            min={5}
            max={180}
            step={5}
            disabled={!reminder.enabled}
            onValueChange={([v]) => onIntervalChange(v)}
          />
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Button size="sm" variant="outline" className="rounded-full" onClick={onPreview}>
            <Play className="size-3.5" /> Preview
          </Button>
          <Button size="sm" variant="outline" className="rounded-full" onClick={onEdit}>
            <Pencil className="size-3.5" /> Edit
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="ml-auto rounded-full text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={onDelete}
          >
            <Trash2 className="size-3.5" /> Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

interface EditorProps {
  open: boolean;
  initial: ReminderItem | null;
  onClose: () => void;
  onSave: (r: ReminderItem) => void;
}

const ReminderEditor = ({ open, initial, onClose, onSave }: EditorProps) => {
  const [draft, setDraft] = useState<ReminderItem | null>(initial);

  // sync when opened with a new reminder
  if (open && initial && draft?.id !== initial.id) {
    setDraft(initial);
  }
  if (!open || !draft) return null;

  const isCustom = draft.kind === "custom";
  const previewStyle = isCustom ? customGradientStyle(draft.hue ?? 280) : undefined;
  const previewClass = !isCustom
    ? builtInGradient[draft.kind as Exclude<typeof draft.kind, "custom">]
    : "";

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="glass max-w-md">
        <DialogHeader>
          <DialogTitle>{initial?.id.startsWith("custom-") && initial.label === "New reminder" ? "Create reminder" : "Edit reminder"}</DialogTitle>
          <DialogDescription>
            {isCustom ? "Customize every detail of your reminder." : "Tweak this built-in reminder."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {/* preview */}
          <div className="flex items-center gap-3 rounded-2xl border border-border p-4">
            <div
              className={cn("flex size-12 items-center justify-center rounded-xl text-2xl", previewClass || "bg-secondary")}
              style={previewStyle}
              aria-hidden
            >
              {draft.emoji}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{draft.label || "Untitled"}</p>
              <p className="truncate text-xs text-muted-foreground">
                {draft.customMessage || "Default message"}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="r-label">Name</Label>
            <Input
              id="r-label"
              value={draft.label}
              maxLength={40}
              onChange={(e) => setDraft({ ...draft, label: e.target.value })}
              placeholder="e.g. Posture check"
            />
          </div>

          <div className="space-y-2">
            <Label>Emoji</Label>
            <div className="flex flex-wrap gap-1.5">
              {EMOJI_PALETTE.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setDraft({ ...draft, emoji: e })}
                  className={cn(
                    "flex size-9 items-center justify-center rounded-lg text-lg transition-all",
                    draft.emoji === e
                      ? "bg-primary/15 ring-2 ring-primary"
                      : "bg-secondary hover:bg-secondary/70",
                  )}
                  aria-label={`Use emoji ${e}`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          {isCustom && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="r-hue">Color</Label>
                <span className="text-xs tabular-nums text-muted-foreground">{draft.hue ?? 280}°</span>
              </div>
              <Slider
                id="r-hue"
                value={[draft.hue ?? 280]}
                min={0}
                max={360}
                step={5}
                onValueChange={([v]) => setDraft({ ...draft, hue: v })}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="r-msg">Message</Label>
            <Textarea
              id="r-msg"
              value={draft.customMessage ?? ""}
              maxLength={120}
              rows={2}
              onChange={(e) => setDraft({ ...draft, customMessage: e.target.value })}
              placeholder={isCustom ? "Time for a mindful pause" : "Leave empty to use default rotating messages"}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Interval</Label>
              <span className="text-xs tabular-nums text-muted-foreground">{draft.intervalMin} min</span>
            </div>
            <Slider
              value={[draft.intervalMin]}
              min={5}
              max={180}
              step={5}
              onValueChange={([v]) => setDraft({ ...draft, intervalMin: v })}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose} className="rounded-full">Cancel</Button>
          <Button
            onClick={() => {
              if (!draft.label.trim()) return;
              onSave(draft);
            }}
            className="rounded-full"
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export const Settings = () => {
  const reminders = useEngine((s) => s.settings.reminders);
  const updateReminder = useEngine((s) => s.updateReminder);
  const addReminder = useEngine((s) => s.addReminder);
  const removeReminder = useEngine((s) => s.removeReminder);
  const triggerReminder = useEngine((s) => s.triggerReminder);
  const desktopNotifications = useEngine((s) => s.settings.desktopNotifications);
  const setDesktopNotifications = useEngine((s) => s.setDesktopNotifications);
  const resetAllData = useEngine((s) => s.resetAllData);

  const [editing, setEditing] = useState<ReminderItem | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<ReminderItem | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Reminder settings</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Add, edit, or remove any reminder. Changes apply instantly.
          </p>
        </div>
        <Button
          onClick={() => setEditing(newCustomReminder())}
          className="rounded-full bg-gradient-primary text-primary-foreground shadow-glow"
        >
          <Plus className="size-4" /> Add reminder
        </Button>
      </div>

      {reminders.length === 0 ? (
        <Card className="glass-soft border-0">
          <CardContent className="flex flex-col items-center gap-3 p-10 text-center">
            <p className="text-sm font-medium">No reminders yet</p>
            <p className="text-xs text-muted-foreground">Create your first reminder to get started.</p>
            <Button onClick={() => setEditing(newCustomReminder())} className="rounded-full">
              <Plus className="size-4" /> Add your first reminder
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {reminders.map((r) => (
            <ReminderRow
              key={r.id}
              reminder={r}
              onToggle={(enabled) => updateReminder(r.id, { enabled })}
              onIntervalChange={(intervalMin) => updateReminder(r.id, { intervalMin })}
              onEdit={() => setEditing(r)}
              onDelete={() => setConfirmDelete(r)}
              onPreview={() => triggerReminder(r.id)}
            />
          ))}
        </div>
      )}

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
          <Switch checked={desktopNotifications} onCheckedChange={setDesktopNotifications} />
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

      <ReminderEditor
        open={!!editing}
        initial={editing}
        onClose={() => setEditing(null)}
        onSave={(r) => {
          const exists = reminders.some((x) => x.id === r.id);
          if (exists) {
            updateReminder(r.id, r);
          } else {
            addReminder(r);
          }
          setEditing(null);
        }}
      />

      <AlertDialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <AlertDialogContent className="glass">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this reminder?</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDelete?.label} will be removed. Past stats stay in your history.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmDelete) removeReminder(confirmDelete.id);
                setConfirmDelete(null);
              }}
              className="rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
