import { NavLink } from "react-router-dom";
import { Activity, BarChart3, Home, Info, Palette, Settings as SettingsIcon, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { to: "/", label: "Dashboard", icon: Home },
  { to: "/settings", label: "Reminders", icon: SettingsIcon },
  { to: "/themes", label: "Appearance", icon: Palette },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/about", label: "About", icon: Info },
];

export const Sidebar = () => (
  <aside className="hidden w-64 shrink-0 flex-col gap-1 p-4 md:flex">
    <div className="mb-6 flex items-center gap-2 px-3 py-2">
      <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-primary shadow-glow">
        <Activity className="size-5 text-primary-foreground" />
      </div>
      <div>
        <p className="text-sm font-semibold leading-tight">FocusPulse</p>
        <p className="text-xs text-muted-foreground">Wellness, quietly.</p>
      </div>
    </div>

    <nav className="flex flex-col gap-1">
      {items.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === "/"}
          className={({ isActive }) =>
            cn(
              "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
              isActive
                ? "glass text-foreground shadow-soft"
                : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
            )
          }
        >
          <Icon className="size-4" />
          {label}
        </NavLink>
      ))}
    </nav>

    <div className="mt-auto">
      <div className="glass-soft rounded-2xl p-4">
        <div className="mb-2 flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <Sparkles className="size-3.5" /> Local & private
        </div>
        <p className="text-xs leading-relaxed text-muted-foreground">
          All your data stays on this device. Nothing is uploaded.
        </p>
      </div>
    </div>
  </aside>
);
