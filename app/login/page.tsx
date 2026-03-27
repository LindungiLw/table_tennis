"use client";

import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore"; // <-- Tambahan import Firestore
import { auth, db } from "@/lib/db"; // <-- Tambahan import db
import { useRouter } from "next/navigation";
import { Activity, Lock, User, AlertCircle, Loader2 } from "lucide-react";

export default function LoginPage() {
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      // --- LOGIKA PINTAR AUTO-EMAIL ---
      let finalEmail = loginId.trim();

      if (!finalEmail.includes("@")) {
        finalEmail = `${finalEmail.replace(/\s+/g, "")}@gmail.com`;
      }

      // 1. Proses Login ke Firebase Auth
      await signInWithEmailAndPassword(auth, finalEmail, password);

      // 2. --- LOGIKA BARU: AUTO-CREATE DATABASE PROFIL ---
      // Ambil nama depan (Misal: natanael -> Natanael)
      const extractedName = finalEmail.split("@")[0];
      const formattedName =
        extractedName.charAt(0).toUpperCase() + extractedName.slice(1);

      // Cek apakah data user ini sudah ada di Firestore Database
      const userRef = doc(db, "users", formattedName);
      const userSnap = await getDoc(userRef);

      // Kalau belum ada, buatkan profilnya secara otomatis!
      if (!userSnap.exists()) {
        await setDoc(userRef, {
          exp: 0,
          teamId: null, // Otomatis jadi Free Agent
          role:
            finalEmail === "rahmalindungilaowo380@gmail.com"
              ? "admin"
              : "member",
        });
      }

      // 3. Jika berhasil, lempar ke halaman Polisi Lalu Lintas (Root)
      router.push("/");
    } catch (err: any) {
      console.error(err);
      setError("Username/Email atau password salah. Coba lagi ya!");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Efek Latar Belakang */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-orange-600/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Logo / Header */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-gradient-to-tr from-orange-500 to-orange-700 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-orange-500/20">
            <Activity className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-widest flex items-center justify-center gap-2">
            PING<span className="text-orange-500 font-black">PONG</span>
          </h1>
          <p className="text-slate-400 mt-2 font-medium">
            Club Management Portal
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-[2.5rem] p-8 shadow-2xl">
          <h2 className="text-xl font-bold text-white mb-6">Masuk ke Arena</h2>

          {error && (
            <div className="mb-6 bg-rose-500/10 border border-rose-500/20 flex items-center gap-3 px-4 py-3 rounded-xl text-rose-400 text-sm font-medium">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="text-slate-500 text-xs font-bold uppercase ml-1">
                Username / Email
              </label>
              <div className="relative mt-2">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-slate-500" />
                </div>
                <input
                  type="text"
                  value={loginId}
                  onChange={(e) => setLoginId(e.target.value)}
                  className="w-full bg-slate-800 border-2 border-slate-700 rounded-2xl pl-11 pr-5 py-4 text-white focus:outline-none focus:border-orange-500 transition-all placeholder:text-slate-600"
                  placeholder="Username"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-slate-500 text-xs font-bold uppercase ml-1">
                Password
              </label>
              <div className="relative mt-2">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-500" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-800 border-2 border-slate-700 rounded-2xl pl-11 pr-5 py-4 text-white focus:outline-none focus:border-orange-500 transition-all placeholder:text-slate-600"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-orange-600 hover:bg-orange-500 disabled:bg-orange-600/50 py-4 mt-8 rounded-2xl font-black text-white transition-all shadow-xl shadow-orange-600/20 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" /> Sedang Masuk...
                </>
              ) : (
                "LOGIN SEKARANG"
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-slate-500 text-xs mt-8">
          Hanya untuk anggota internal Pingpong Club JIU.
        </p>
      </div>
    </div>
  );
}
