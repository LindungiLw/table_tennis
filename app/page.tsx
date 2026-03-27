"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/db";
import { Loader2, Activity } from "lucide-react";

export default function HomePage() {
  const router = useRouter();
  const ADMIN_EMAIL = "rahmalindungilaowo380@gmail.com";

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.push("/login");
        return;
      }

      const amanEmail = user.email || "";
      if (amanEmail === ADMIN_EMAIL) {
        router.push("/admin");
      } else {
        router.push("/portal");
      }
    });

    return () => unsub();
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-6 absolute inset-0 z-50">
      <div className="w-16 h-16 bg-gradient-to-tr from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/20 animate-pulse">
        <Activity className="w-8 h-8 text-white" />
      </div>
      <div className="flex flex-col items-center gap-2">
        <Loader2 className="w-6 h-6 text-orange-500 animate-spin" />
        <p className="text-slate-500 font-bold uppercase text-xs tracking-widest">
          Mengarahkan ke Portal...
        </p>
      </div>
    </div>
  );
}
