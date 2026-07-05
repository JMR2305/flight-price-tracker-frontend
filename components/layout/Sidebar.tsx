"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Plane,
  Bell,
  Settings,
  TrendingDown,
  Activity,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/flights", label: "Flights", icon: Plane },
  { href: "/alerts", label: "Alerts", icon: Bell },
  { href: "/status", label: "System Status", icon: Activity },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex flex-col w-60 min-h-screen bg-white border-r border-gray-200">
      <div className="flex items-center gap-2.5 px-6 py-5 border-b border-gray-200">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-brand-600">
          <TrendingDown className="w-4 h-4 text-white" />
        </div>
        <span className="font-semibold text-gray-900 text-sm">FlightTracker</span>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? "bg-brand-50 text-brand-700"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              <Icon className={`w-4 h-4 ${active ? "text-brand-600" : ""}`} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="px-4 py-4 border-t border-gray-200">
        <div className="flex items-center gap-3 px-2 py-2 rounded-lg bg-gray-50">
          <div className="w-7 h-7 rounded-full bg-brand-600 flex items-center justify-center text-white text-xs font-semibold">
            U
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-gray-900 truncate">User</p>
            <p className="text-xs text-gray-500 truncate">Free plan</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
