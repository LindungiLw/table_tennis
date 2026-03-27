"use client";

import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/db";
import { useRouter } from "next/navigation";
import { Lock, Mail, Activity } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      // Perintah asli ke Firebase untuk mengecek email & password
      await signInWithEmailAndPassword(auth, email, password);

      // Jika berhasil, tendang user ke halaman Dashboard utama
      router.push("/");
    } catch (err: any) {
      // Jika gagal (password salah/email tidak ada)
      setError("Email atau password salah. Silakan coba lagi.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 w-full absolute inset-0 z-50">
      {/* Background Ornamen */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -right-[10%] w-[70%] h-[70%] rounded-full bg-orange-600/5 blur-[120px]" />
        <div className="absolute -bottom-[20%] -left-[10%] w-[70%] h-[70%] rounded-full bg-blue-600/5 blur-[120px]" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo Club */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-gradient-to-tr from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-orange-500/20 transform rotate-12">
            <Activity className="w-8 h-8 text-white -rotate-12" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-widest flex items-center justify-center gap-2">
            PING<span className="text-orange-500 font-black">PONG</span>
          </h1>
          <p className="text-slate-400 mt-2 font-medium">
            Club Management Portal
          </p>
        </div>

        {/* Form Login */}
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 p-8 rounded-3xl shadow-2xl">
          <form onSubmit={handleLogin} className="space-y-6">
            {/* Pesan Error */}
            {error && (
              <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 px-4 py-3 rounded-xl text-sm font-medium text-center">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-slate-400 mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-500" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-11 pr-4 py-3.5 bg-slate-950/50 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all"
                  placeholder="admin@pingpong.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-400 mb-2">
                Password / Passcode
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-500" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-11 pr-4 py-3.5 bg-slate-950/50 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 text-white font-bold py-3.5 px-4 rounded-xl transition-all shadow-lg shadow-orange-500/25 flex items-center justify-center disabled:opacity-70"
            >
              {isLoading ? "Authenticating..." : "Masuk ke Portal"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
