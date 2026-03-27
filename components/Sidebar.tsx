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
  Menu, // <-- Tambahan icon untuk HP
  X, // <-- Tambahan icon tutup untuk HP
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

  // --- STATE BARU: Untuk buka/tutup menu di layar HP ---
  const [isMobileOpen, setIsMobileOpen] = useState(false);

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

  // --- Tutup sidebar otomatis setiap kali pindah halaman di HP ---
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  if (pathname === "/login" || pathname === "/") return null;

  const adminLinks = [
    { icon: ShieldAlert, label: "Admin Panel", href: "/admin", badge: null },
    {
      icon: Target,
      label: "Kelola Misi",
      href: "/admin/quests",
      badge: "Aksi",
    },
    { icon: Users, label: "Data Member", href: "/admin/members", badge: null },
    { icon: LineChart, label: "Club Stats", href: "#", badge: null },
  ];

  const memberLinks = [
    { icon: Swords, label: "Arena Latihan", href: "/portal", badge: "EXP" },
    { icon: Trophy, label: "Leaderboard", href: "#", badge: null },
    { icon: Calendar, label: "Jadwal Tanding", href: "#", badge: null },
    { icon: Settings, label: "Pengaturan", href: "#", badge: null },
  ];

  const currentLinks = isAdmin ? adminLinks : memberLinks;

  return (
    <>
      {/* --- TOMBOL HAMBURGER (Hanya muncul di HP/layar kecil) --- */}
      <button
        onClick={() => setIsMobileOpen(true)}
        className="md:hidden fixed top-5 left-5 z-[60] p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white shadow-lg"
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* --- BACKGROUND GELAP SAAT MENU BUKA DI HP --- */}
      {isMobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/80 backdrop-blur-sm z-[70]"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* --- SIDEBAR UTAMA --- */}
      <aside
        className={`fixed inset-y-0 left-0 z-[80] w-72 md:w-64 bg-slate-950 flex flex-col h-screen border-r border-slate-800 transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-8 flex items-center justify-between">
          <h1 className="text-white text-2xl font-bold tracking-widest flex items-center gap-2">
            PING<span className="text-orange-500 font-black">PONG</span>
          </h1>
          {/* Tombol X (Tutup) hanya muncul di HP */}
          <button
            onClick={() => setIsMobileOpen(false)}
            className="md:hidden text-slate-500 hover:text-white"
          >
            <X className="w-6 h-6" />
          </button>
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

        {/* PROFIL BAWAH */}
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
            onClick={async () => {
              await signOut(auth);
              router.push("/login");
            }}
            className="w-full flex items-center justify-center gap-3 px-4 py-3.5 rounded-xl text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-colors font-bold text-sm border border-transparent hover:border-rose-500/20"
          >
            <LogOut className="w-5 h-5" /> Keluar Akun
          </button>
        </div>
      </aside>
    </>
  );
}
