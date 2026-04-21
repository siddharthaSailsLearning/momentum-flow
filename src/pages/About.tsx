import { Card, CardContent } from "@/components/ui/card";
import { Activity, ShieldCheck, Sparkles, Heart } from "lucide-react";

const Item = ({
  icon: Icon,
  title,
  body,
}: {
  icon: typeof Activity;
  title: string;
  body: string;
}) => (
  <div className="flex gap-3">
    <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-secondary">
      <Icon className="size-4" />
    </div>
    <div>
      <p className="text-sm font-semibold">{title}</p>
      <p className="text-xs text-muted-foreground">{body}</p>
    </div>
  </div>
);

export const About = () => (
  <div className="space-y-6">
    <Card className="glass overflow-hidden border-0">
      <CardContent className="relative p-8 text-center">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-gradient-primary opacity-30 blur-3xl" />
        <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-gradient-primary shadow-glow">
          <Activity className="size-6 text-primary-foreground" />
        </div>
        <h1 className="text-3xl font-semibold tracking-tight">FocusPulse</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          A calm wellness companion for people who live in front of a screen.
        </p>
      </CardContent>
    </Card>

    <Card className="glass-soft border-0">
      <CardContent className="space-y-4 p-6">
        <Item
          icon={ShieldCheck}
          title="Local & private"
          body="All data lives in your browser. No accounts, no tracking, no uploads."
        />
        <Item
          icon={Sparkles}
          title="Designed for calm"
          body="Glassy surfaces, soft motion, and intervals you control. Never noisy."
        />
        <Item
          icon={Heart}
          title="Made with care"
          body="Built for IT, designers, students and anyone working long screen days."
        />
      </CardContent>
    </Card>

    <Card className="glass-soft border-0">
      <CardContent className="p-6">
        <p className="text-sm font-semibold">Roadmap</p>
        <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
          <li>· Electron desktop wrapper with system tray</li>
          <li>· Auto-launch with Windows & multi-monitor overlays</li>
          <li>· Inactivity & meeting detection (auto-pause)</li>
          <li>· Pro themes & AI wellness coach</li>
          <li>· Team plans with anonymous adherence reports</li>
        </ul>
      </CardContent>
    </Card>

    <p className="px-1 text-center text-xs text-muted-foreground">v1.0 · Phase 1 MVP</p>
  </div>
);
