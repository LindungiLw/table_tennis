"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Key,
  Target,
  Trophy,
  Calendar,
  LineChart,
  Settings,
} from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname(); // Mengambil URL saat ini

  if (pathname === "/login") return null;

  const links = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/", badge: null },
    { icon: Target, label: "Daily Quests", href: "/admin", badge: "+EXP" },
    { icon: Key, label: "Team Portal", href: "/portal", badge: null },
    { icon: Users, label: "Members", href: "#", badge: null },
    { icon: Trophy, label: "Leaderboard", href: "#", badge: null },
    { icon: Calendar, label: "Schedule", href: "#", badge: null },
    { icon: LineChart, label: "Performance", href: "#", badge: null },
    { icon: Settings, label: "Settings", href: "#", badge: null },
  ];

  return (
    // Aku hapus 'fixed' karena kita sudah pakai flex di layout.tsx
    <aside className="w-64 bg-slate-900 flex flex-col h-screen border-r border-slate-800">
      <div className="p-8">
        <h1 className="text-white text-2xl font-bold tracking-widest flex items-center gap-2">
          PING<span className="text-orange-500 font-black">PONG</span>
        </h1>
      </div>

      <nav className="flex-1 px-4 space-y-1.5 mt-2">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href; // Logika otomatis deteksi menu aktif

          return (
            <Link
              key={link.label}
              href={link.href}
              className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group ${
                isActive
                  ? "bg-slate-800 text-white shadow-sm"
                  : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
              }`}
            >
              <div className="flex items-center gap-3.5">
                <Icon
                  className={`w-5 h-5 transition-colors ${isActive ? "text-orange-500" : "group-hover:text-orange-400/70"}`}
                />
                <span
                  className={`font-medium text-sm ${isActive ? "font-semibold" : ""}`}
                >
                  {link.label}
                </span>
              </div>
              {link.badge && (
                <span className="text-[9px] bg-orange-500/10 text-orange-400 border border-orange-500/20 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                  {link.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-6 mt-auto">
        <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-800/50 border border-slate-700/50 transition-colors hover:bg-slate-800 cursor-pointer">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold shadow-inner">
            L
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-slate-200 text-sm font-semibold truncate">
              Lindungi
            </p>
            <p className="text-slate-500 text-xs truncate">Koordinator Klub</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
