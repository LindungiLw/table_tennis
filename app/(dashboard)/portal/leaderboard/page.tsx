"use client";

import {
  Trophy,
  Crown,
  User,
  Loader2,
  Medal,
  Swords,
  TrendingUp,
} from "lucide-react";
import { useState, useEffect } from "react";
import { collection, onSnapshot, doc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/lib/db";
import { useRouter } from "next/navigation";

export default function MemberLeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [individualLeaderboard, setIndividualLeaderboard] = useState<any[]>([]);
  const [weeklyExp, setWeeklyExp] = useState(0);

  // Auth & User State
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [userName, setUserName] = useState("Pemain");
  const [userTeam, setUserTeam] = useState<string | null>(null);

  const router = useRouter();
  const ADMIN_EMAIL = "rahmalindungilaowo380@gmail.com";

  // --- 1. PROTEKSI RUTE KHUSUS MEMBER ---
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.push("/login");
        return;
      }

      const amanEmail = user.email || "";

      if (amanEmail === ADMIN_EMAIL) {
        router.push("/admin");
      } else {
        const extractedName = amanEmail.split("@")[0] || "Pemain";
        setUserName(
          extractedName.charAt(0).toUpperCase() + extractedName.slice(1),
        );
        setIsAuthChecking(false);
      }
    });
    return () => unsubAuth();
  }, [router]);

  // --- 2. REAL-TIME DATA (HANYA UNTUK PERINGKAT) ---
  useEffect(() => {
    if (!db || isAuthChecking || !userName) return;

    // A. Tarik Data User Pribadi (Hanya untuk tahu timnya apa)
    const unsubUser = onSnapshot(doc(db, "users", userName), (docSnap) => {
      if (docSnap.exists()) {
        setUserTeam(docSnap.data().teamId || null);
      }
    });

    // B. Tarik Leaderboard Tim (Dengan Tie-Breaker Waktu)
    const unsubLeaderboard = onSnapshot(collection(db, "teams"), (snapshot) => {
      const teamsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setLeaderboard(
        teamsData.sort((a: any, b: any) => {
          if (b.exp !== a.exp) return (b.exp || 0) - (a.exp || 0);
          const timeA = a.lastExpUpdate?.seconds || Infinity;
          const timeB = b.lastExpUpdate?.seconds || Infinity;
          return timeA - timeB;
        }),
      );
    });

    // C. Tarik Leaderboard Individu (Dengan Tie-Breaker Waktu)
    const unsubIndivLeaderboard = onSnapshot(
      collection(db, "users"),
      (snapshot) => {
        const usersData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        const filteredUsers = usersData.filter((u: any) => u.role !== "admin");

        setIndividualLeaderboard(
          filteredUsers.sort((a: any, b: any) => {
            if (b.exp !== a.exp) return (b.exp || 0) - (a.exp || 0);
            const timeA = a.lastExpUpdate?.seconds || Infinity;
            const timeB = b.lastExpUpdate?.seconds || Infinity;
            return timeA - timeB;
          }),
        );
      },
    );

    // D. Tarik Statistik Global
    const unsubStats = onSnapshot(
      doc(db, "club_stats", "weekly"),
      (docSnap) => {
        if (docSnap.exists()) setWeeklyExp(docSnap.data().totalExp || 0);
      },
    );

    return () => {
      unsubUser();
      unsubLeaderboard();
      unsubIndivLeaderboard();
      unsubStats();
    };
  }, [isAuthChecking, userName]);

  // Ambil top 3 tim untuk podium
  const top3Teams = leaderboard.slice(0, 3);

  // Hitung peringkat user saat ini (Individu)
  const myIndivRank =
    individualLeaderboard.findIndex((p) => p.id === userName) + 1;

  // Hitung peringkat tim user saat ini
  const myTeamRank = userTeam
    ? leaderboard.findIndex((t) => t.id === userTeam) + 1
    : 0;

  if (isAuthChecking)
    return (
      <div className="h-screen bg-slate-950 flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
        <p className="text-slate-500 font-bold uppercase text-xs tracking-widest">
          Memuat Papan Peringkat...
        </p>
      </div>
    );

  return (
    <div className="p-8 lg:p-10 max-w-7xl mx-auto space-y-10 h-screen overflow-y-auto pb-24 scrollbar-hide">
      {/* HEADER LEADERBOARD */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            Papan Peringkat <Trophy className="w-7 h-7 text-amber-500" />
          </h2>
          <p className="text-slate-400 mt-2">
            Pantau performa tim dan individu di Pingpong Club JIU. Siapa yang
            ada di puncak?
          </p>
        </div>

        {/* WIDGET STATUS PRIBADI MINI */}
        <div className="flex gap-4">
          <div className="bg-slate-800/60 border border-slate-700 px-5 py-3 rounded-2xl">
            <p className="text-xs text-slate-500 font-bold uppercase mb-1">
              Rank Timmu
            </p>
            <p className="text-lg font-black text-amber-400 flex items-center gap-2">
              <Swords className="w-4 h-4" />{" "}
              {myTeamRank > 0 ? `#${myTeamRank}` : "N/A"}
            </p>
          </div>
          <div className="bg-slate-800/60 border border-slate-700 px-5 py-3 rounded-2xl">
            <p className="text-xs text-slate-500 font-bold uppercase mb-1">
              Rank Pribadi
            </p>
            <p className="text-lg font-black text-blue-400 flex items-center gap-2">
              <User className="w-4 h-4" />{" "}
              {myIndivRank > 0 ? `#${myIndivRank}` : "N/A"}
            </p>
          </div>
        </div>
      </section>

      {/* --- WIDGET TOP 3 TIM DUO (PODIUM) --- */}
      {top3Teams.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {top3Teams.map((team, idx) => {
            let style = "bg-slate-800/40 border-slate-700/50";
            let iconColor = "text-slate-400";
            let rankLabel = "Rank " + (idx + 1);
            let isMyTeam = team.id === userTeam;

            if (idx === 0) {
              style =
                "bg-gradient-to-br from-amber-500/20 to-amber-700/10 border-amber-500/40 shadow-lg shadow-amber-500/10";
              iconColor = "text-amber-500";
              rankLabel = "Juara 1 🏆";
            } else if (idx === 1) {
              style =
                "bg-gradient-to-br from-slate-300/10 to-slate-500/10 border-slate-400/40";
              iconColor = "text-slate-300";
              rankLabel = "Juara 2 🥈";
            } else if (idx === 2) {
              style =
                "bg-gradient-to-br from-amber-700/20 to-amber-900/10 border-amber-700/40";
              iconColor = "text-amber-600";
              rankLabel = "Juara 3 🥉";
            }

            // Highlight jika ini adalah tim user yang sedang login
            if (isMyTeam) {
              style +=
                " ring-2 ring-emerald-500 ring-offset-4 ring-offset-slate-950";
            }

            return (
              <div
                key={team.id}
                className={`p-6 rounded-3xl border flex items-center justify-between ${style} transition-transform hover:-translate-y-1 relative`}
              >
                {isMyTeam && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-500 text-slate-950 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-lg shadow-emerald-500/20">
                    Tim Kamu
                  </div>
                )}

                <div className="flex items-center gap-4">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center bg-slate-900/50 ${iconColor}`}
                  >
                    {idx === 0 ? (
                      <Crown className="w-6 h-6" />
                    ) : (
                      <Medal className="w-6 h-6" />
                    )}
                  </div>
                  <div>
                    <p
                      className={`text-xs font-bold uppercase tracking-wider mb-1 ${iconColor}`}
                    >
                      {rankLabel}
                    </p>
                    <p className="font-bold text-white text-lg leading-tight">
                      {team.name}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-3xl font-black ${iconColor}`}>
                    {team.exp || 0}
                  </p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">
                    EXP
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-slate-800/20 border border-slate-700/50 rounded-3xl p-10 text-center">
          <Trophy className="w-12 h-12 text-slate-600 mx-auto mb-4 opacity-50" />
          <p className="text-slate-400 font-medium">
            belum ada tim yang mengumpulkan poin.
          </p>
        </div>
      )}

      {/* --- GRID TABEL PERINGKAT --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* TABEL LEADERBOARD TIM */}
        <div className="bg-slate-800/40 rounded-3xl p-7 border border-slate-700/50 flex flex-col h-[500px]">
          <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
            <Swords className="w-5 h-5 text-amber-500" /> Peringkat Tim Lengkap
          </h3>
          {leaderboard.length === 0 ? (
            <p className="text-slate-500 text-sm flex-1 flex items-center justify-center">
              Belum ada data tim.
            </p>
          ) : (
            <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar flex-1">
              {leaderboard.map((team, idx) => (
                <div
                  key={team.id}
                  className={`flex items-center justify-between p-4 rounded-2xl transition-colors ${team.id === userTeam ? "bg-amber-500/10 border border-amber-500/30" : "bg-slate-900/50 border border-slate-800 hover:border-slate-700"}`}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm ${idx === 0 ? "bg-amber-500 text-slate-900" : idx === 1 ? "bg-slate-300 text-slate-800" : idx === 2 ? "bg-amber-700/50 text-amber-200" : "bg-slate-800 text-slate-400"}`}
                    >
                      {idx === 0 ? <Crown className="w-4 h-4" /> : idx + 1}
                    </div>
                    <div>
                      <p
                        className={`font-bold ${idx === 0 ? "text-white" : "text-slate-300"} text-base`}
                      >
                        {team.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {team.members?.join(" & ")}
                      </p>
                    </div>
                  </div>
                  <div
                    className={`font-black ${idx === 0 ? "text-amber-500" : "text-slate-400"} text-lg`}
                  >
                    {team.exp || 0}{" "}
                    <span className="text-[10px] ml-0.5 opacity-50">EXP</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* TABEL LEADERBOARD INDIVIDU */}
        <div className="bg-slate-800/40 rounded-3xl p-7 border border-slate-700/50 flex flex-col h-[500px]">
          <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
            <User className="w-5 h-5 text-blue-500" /> Peringkat Individu
            Lengkap
          </h3>
          {individualLeaderboard.length === 0 ? (
            <p className="text-slate-500 text-sm flex-1 flex items-center justify-center">
              Belum ada data pemain.
            </p>
          ) : (
            <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar flex-1">
              {individualLeaderboard.map((player, idx) => (
                <div
                  key={player.id}
                  className={`flex items-center justify-between p-4 rounded-2xl transition-colors ${player.id === userName ? "bg-blue-500/10 border border-blue-500/30" : "bg-slate-900/50 border border-slate-800 hover:border-slate-700"}`}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm ${idx === 0 ? "bg-blue-500 text-white" : idx === 1 ? "bg-slate-300 text-slate-800" : idx === 2 ? "bg-blue-900/50 text-blue-300" : "bg-slate-800 text-slate-400"}`}
                    >
                      {idx === 0 ? <Crown className="w-4 h-4" /> : idx + 1}
                    </div>
                    <div>
                      <p
                        className={`font-bold ${idx === 0 ? "text-white" : "text-slate-300"} text-base`}
                      >
                        {player.id} {player.id === userName && "(Kamu)"}
                      </p>
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                        {player.teamId || "Free Agent"}
                      </p>
                    </div>
                  </div>
                  <div
                    className={`font-black ${idx === 0 ? "text-blue-500" : "text-slate-400"} text-lg`}
                  >
                    {player.exp || 0}{" "}
                    <span className="text-[10px] ml-0.5 opacity-50">EXP</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* TOTAL EXP WIDGET (MINI) */}
      <div className="bg-gradient-to-br from-orange-500 to-orange-700 rounded-3xl p-6 text-white shadow-xl shadow-orange-500/10 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="bg-white/20 p-3 rounded-2xl">
            <TrendingUp className="w-8 h-8 text-orange-100" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-orange-200 uppercase tracking-widest">
              Total EXP Global Terkumpul
            </h3>
            <p className="text-sm text-orange-100/70 font-medium">
              Pingpong Club JIU
            </p>
          </div>
        </div>
        <p className="text-5xl font-black">{weeklyExp.toLocaleString()}</p>
      </div>
    </div>
  );
}
