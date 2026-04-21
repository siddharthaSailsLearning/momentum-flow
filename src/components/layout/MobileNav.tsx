import { NavLink } from "react-router-dom";
import { BarChart3, Home, Info, Palette, Settings as SettingsIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { to: "/", label: "Home", icon: Home },
  { to: "/settings", label: "Reminders", icon: SettingsIcon },
  { to: "/themes", label: "Look", icon: Palette },
  { to: "/analytics", label: "Stats", icon: BarChart3 },
  { to: "/about", label: "About", icon: Info },
];

export const MobileNav = () => (
  <nav className="glass fixed inset-x-3 bottom-3 z-40 flex justify-around rounded-2xl px-2 py-2 md:hidden">
    {items.map(({ to, label, icon: Icon }) => (
      <NavLink
        key={to}
        to={to}
        end={to === "/"}
        className={({ isActive }) =>
          cn(
            "flex flex-1 flex-col items-center gap-0.5 rounded-xl px-2 py-1.5 text-[10px] font-medium transition-colors",
            isActive ? "bg-secondary text-foreground" : "text-muted-foreground",
          )
        }
      >
        <Icon className="size-4" />
        {label}
      </NavLink>
    ))}
  </nav>
);
