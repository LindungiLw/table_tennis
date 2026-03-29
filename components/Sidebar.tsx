"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Target,
  Trophy,
  Calendar,
  LineChart,
  Settings,
  LogOut,
  ShieldAlert,
  Swords,
} from "lucide-react";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/db";
import { useState, useEffect } from "react";

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const ADMIN_EMAIL = "rahmalindungilaowo380@gmail.com";

  const [userName, setUserName] = useState("Loading...");
  const [userRole, setUserRole] = useState("...");
  const [userInitial, setUserInitial] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user && user.email) {
        const extractedName = user.email.split("@")[0];
        const formattedName =
          extractedName.charAt(0).toUpperCase() + extractedName.slice(1);
        setUserName(formattedName);
        setUserInitial(formattedName.charAt(0).toUpperCase());

        if (user.email === ADMIN_EMAIL) {
          setUserRole("Koordinator Klub");
          setIsAdmin(true);
        } else {
          setUserRole("Member Tim");
          setIsAdmin(false);
        }
      }
    });
    return () => unsub();
  }, []);

  if (pathname === "/login" || pathname === "/") return null;

  const adminLinks = [
    { icon: ShieldAlert, label: "Admin", href: "/admin", badge: null },
    { icon: Target, label: "Misi", href: "/admin/quests", badge: "Aksi" },
    { icon: Users, label: "Member", href: "/admin/members", badge: null },
    { icon: LineChart, label: "Stats", href: "#", badge: null },
  ];

  const memberLinks = [
    { icon: Swords, label: "Arena", href: "/portal", badge: "EXP" },
    {
      icon: Trophy,
      label: "Peringkat",
      href: "/portal/leaderboard",
      badge: null,
    },
    { icon: Calendar, label: "Jadwal", href: "#", badge: null },
    { icon: Settings, label: "Setelan", href: "#", badge: null },
  ];

  const currentLinks = isAdmin ? adminLinks : memberLinks;

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/login");
  };

  return (
    <>
      {/* ========================================== */}
      {/* 📱 TAMPILAN MOBILE (HP)                    */}
      {/* ========================================== */}

      {/* 1. Top Bar Mobile (Logo & Logout) */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-slate-950/90 backdrop-blur-xl border-b border-slate-800 z-50 flex items-center justify-between px-6 shadow-sm">
        <h1 className="text-white text-lg font-bold tracking-widest flex items-center gap-1">
          PING<span className="text-orange-500 font-black">PONG</span>
        </h1>
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold text-xs shadow-inner">
            {userInitial}
          </div>
          <button
            onClick={handleLogout}
            className="text-slate-500 hover:text-rose-500 transition-colors"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 2. Bottom Nav Bar Mobile (Menu Navigasi) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-[75px] bg-slate-950/95 backdrop-blur-xl border-t border-slate-800 z-50 flex items-center justify-around px-2 pb-2 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
        {currentLinks.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href && link.href !== "#";

          return (
            <Link
              key={link.label}
              href={link.href}
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 relative transition-all duration-300 ${
                isActive
                  ? "text-orange-500"
                  : "text-slate-500 hover:text-slate-300"
              }`}
            >
              {/* Indikator Garis Aktif ala iOS */}
              {isActive && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-orange-500 rounded-b-full shadow-[0_0_10px_rgba(249,115,22,0.5)]" />
              )}

              <Icon
                className={`w-6 h-6 mt-1 transition-transform duration-300 ${isActive ? "scale-110 drop-shadow-md" : "scale-100"}`}
              />
              <span
                className={`text-[10px] font-bold tracking-wide ${isActive ? "text-orange-500" : "text-slate-500"}`}
              >
                {link.label}
              </span>

              {/* Badge Titik Merah Notifikasi untuk HP */}
              {link.badge && !isActive && (
                <div className="absolute top-2.5 right-1/4 w-2 h-2 bg-rose-500 rounded-full animate-pulse ring-2 ring-slate-950" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* ========================================== */}
      {/* 💻 TAMPILAN DESKTOP (PC/LAPTOP)            */}
      {/* ========================================== */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-950 h-screen border-r border-slate-800 sticky top-0">
        <div className="p-8 flex items-center justify-between">
          <h1 className="text-white text-2xl font-bold tracking-widest flex items-center gap-2">
            PING<span className="text-orange-500 font-black">PONG</span>
          </h1>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-2 overflow-y-auto">
          {currentLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href && link.href !== "#";

            return (
              <Link
                key={link.label}
                href={link.href}
                className={`flex items-center justify-between px-4 py-3.5 rounded-xl transition-all duration-200 group ${
                  isActive
                    ? "bg-slate-800 text-white shadow-sm border border-slate-700"
                    : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 border border-transparent"
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <Icon
                    className={`w-5 h-5 transition-colors ${isActive ? "text-orange-500" : "group-hover:text-orange-400/70"}`}
                  />
                  <span
                    className={`font-medium text-[15px] ${isActive ? "font-semibold" : ""}`}
                  >
                    {link.label}
                  </span>
                </div>
                {link.badge && (
                  <span className="text-[10px] bg-orange-500/10 text-orange-400 border border-orange-500/20 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                    {link.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-6 mt-auto border-t border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-3 px-2 py-2 mb-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold shadow-inner text-lg">
              {userInitial}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-slate-200 text-sm font-semibold truncate">
                {userName}
              </p>
              <p className="text-slate-500 text-xs truncate">{userRole}</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-3 px-4 py-3.5 rounded-xl text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-colors font-bold text-sm border border-transparent hover:border-rose-500/20"
          >
            <LogOut className="w-5 h-5" /> Keluar Akun
          </button>
        </div>
      </aside>
    </>
  );
}
