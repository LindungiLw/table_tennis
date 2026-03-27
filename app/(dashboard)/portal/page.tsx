"use client";

import {
  Target,
  Trophy,
  Zap,
  CheckCircle2,
  Circle,
  Crown,
  User,
  Loader2,
  ShieldAlert,
} from "lucide-react";
import { useState, useEffect } from "react";
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  increment,
  setDoc,
  arrayUnion,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/lib/db";
import { useRouter } from "next/navigation";

export default function PortalPage() {
  const [quests, setQuests] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [weeklyExp, setWeeklyExp] = useState(0);

  // Auth & User State
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [userName, setUserName] = useState("Pemain");
  const [userTeam, setUserTeam] = useState<string | null>(null);
  const [userExp, setUserExp] = useState(0);

  const router = useRouter();
  const ADMIN_EMAIL = "rahmalindungilaowo380@gmail.com";

  // --- 1. PROTEKSI RUTE KHUSUS MEMBER ---
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.push("/login");
        return;
      }

      // CARA AMAN TYPESCRIPT
      const amanEmail = user.email || "";

      if (amanEmail === ADMIN_EMAIL) {
        // KICK OUT: Kalau Admin nyasar ke sini, balikin ke /admin!
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

  // --- 2. REAL-TIME DATA (CCTV MEMBER) ---
  useEffect(() => {
    if (!db || isAuthChecking || !userName) return;

    // A. Tarik Data User (Tim & EXP Individu)
    const unsubUser = onSnapshot(doc(db, "users", userName), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setUserTeam(data.teamId || null);
        setUserExp(data.exp || 0);
      }
    });

    // B. Tarik Misi (HANYA tampilkan misi "Semua Tim" atau khusus tim user ini)
    const unsubQuests = onSnapshot(collection(db, "quests"), (snapshot) => {
      const questsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      const filteredQuests = questsData.filter(
        (q: any) => q.targetTeam === "Semua Tim" || q.targetTeam === userTeam,
      );
      setQuests(
        filteredQuests.sort(
          (a: any, b: any) =>
            (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0),
        ),
      );
    });

    // C. Tarik Leaderboard Tim
    const unsubLeaderboard = onSnapshot(collection(db, "teams"), (snapshot) => {
      const teamsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setLeaderboard(
        teamsData.sort((a: any, b: any) => (b.exp || 0) - (a.exp || 0)),
      );
    });

    // D. Tarik Statistik Global
    const unsubStats = onSnapshot(
      doc(db, "club_stats", "weekly"),
      (docSnap) => {
        if (docSnap.exists()) setWeeklyExp(docSnap.data().totalExp || 0);
      },
    );

    return () => {
      unsubUser();
      unsubQuests();
      unsubLeaderboard();
      unsubStats();
    };
  }, [isAuthChecking, userName, userTeam]);

  // --- 3. FUNGSI MEMBER: KLAIM EXP LATIHAN ---
  const handleCompleteQuest = async (questId: string, questExp: number) => {
    try {
      await updateDoc(doc(db, "quests", questId), {
        completedBy: arrayUnion(userName),
      });
      await updateDoc(doc(db, "users", userName), { exp: increment(questExp) });
      if (userTeam) {
        await updateDoc(doc(db, "teams", userTeam), {
          exp: increment(questExp),
        });
      }
      await setDoc(
        doc(db, "club_stats", "weekly"),
        { totalExp: increment(questExp) },
        { merge: true },
      );
      alert(`Mantap ${userName}! +${questExp} EXP berhasil diklaim! 🚀`);
    } catch (error) {
      console.error(error);
      alert("Gagal klaim EXP. Coba lagi ya.");
    }
  };

  const getDifficultyColor = (diff: string) => {
    switch (diff) {
      case "Beginner":
        return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
      case "Intermediate":
        return "text-amber-400 bg-amber-500/10 border-amber-500/20";
      case "Hard":
        return "text-rose-400 bg-rose-500/10 border-rose-500/20";
      default:
        return "text-slate-400 bg-slate-800 border-slate-700";
    }
  };

  if (isAuthChecking)
    return (
      <div className="h-screen bg-slate-950 flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
        <p className="text-slate-500 font-bold uppercase text-xs tracking-widest">
          Menyiapkan Arena Latihan...
        </p>
      </div>
    );

  return (
    <div className="p-8 lg:p-10 max-w-7xl mx-auto space-y-8 h-screen overflow-y-auto pb-24 scrollbar-hide">
      {/* HEADER KHUSUS MEMBER */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight">
            Welcome back, <span className="text-orange-500">{userName}</span> 👋
          </h2>
          <div className="flex flex-wrap items-center gap-3 mt-3">
            <span className="text-xs font-bold text-slate-400 bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-lg flex items-center gap-2">
              <span
                className={`w-2 h-2 rounded-full animate-pulse ${userTeam ? "bg-emerald-500" : "bg-slate-500"}`}
              />
              Squad:{" "}
              <strong
                className={userTeam ? "text-emerald-400" : "text-slate-400"}
              >
                {userTeam || "Free Agent"}
              </strong>
            </span>
            <span className="text-xs font-bold text-orange-400 bg-orange-500/10 border border-orange-500/20 px-3 py-1.5 rounded-lg flex items-center gap-2">
              <User className="w-3.5 h-3.5" /> Personal EXP: {userExp}
            </span>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* KOLOM KIRI: MISI MEMBER */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-800/40 rounded-3xl p-7 border border-slate-700/50">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Target className="w-5 h-5 text-orange-500" /> Available
                Training
              </h3>
            </div>

            <div className="space-y-4">
              {quests.length === 0 ? (
                <p className="text-slate-500 text-center py-10 flex flex-col items-center gap-2">
                  <ShieldAlert className="w-8 h-8 opacity-50 mb-2" />
                  Belum ada jadwal latihan untuk timmu saat ini.
                </p>
              ) : (
                quests.map((quest) => {
                  const isClaimed = quest.completedBy?.includes(userName);
                  return (
                    <div
                      key={quest.id}
                      className={`group flex items-center justify-between p-5 rounded-2xl border transition-all ${isClaimed ? "bg-slate-900/40 border-slate-800 opacity-60" : "bg-slate-800/60 border-slate-700 hover:border-orange-500/40"}`}
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={
                            isClaimed ? "text-emerald-500" : "text-slate-600"
                          }
                        >
                          {isClaimed ? (
                            <CheckCircle2 className="w-6 h-6" />
                          ) : (
                            <Circle className="w-6 h-6" />
                          )}
                        </div>
                        <div>
                          <p
                            className={`font-bold ${isClaimed ? "text-slate-500 line-through" : "text-slate-200"}`}
                          >
                            {quest.title}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span
                              className={`inline-block text-[10px] font-black px-2 py-0.5 rounded-md border uppercase ${getDifficultyColor(quest.difficulty)}`}
                            >
                              {quest.difficulty}
                            </span>
                            {quest.targetTeam !== "Semua Tim" && (
                              <span className="text-[10px] font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-500/20 uppercase">
                                {quest.targetTeam}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {!isClaimed ? (
                          <button
                            onClick={() =>
                              handleCompleteQuest(quest.id, quest.exp)
                            }
                            className="bg-orange-500/10 hover:bg-orange-500 text-orange-500 hover:text-white border border-orange-500/20 px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2"
                          >
                            <Zap className="w-3.5 h-3.5" /> Klaim {quest.exp}{" "}
                            EXP
                          </button>
                        ) : (
                          <span className="text-xs font-bold text-emerald-500 bg-emerald-500/10 px-3 py-1.5 rounded-lg flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Selesai
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* KOLOM KANAN: LEADERBOARD */}
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-orange-500 to-orange-700 rounded-3xl p-7 text-white shadow-xl shadow-orange-500/10">
            <h3 className="text-xs font-bold text-orange-200 uppercase tracking-widest mb-4">
              Total EXP Minggu Ini
            </h3>
            <p className="text-5xl font-black">{weeklyExp.toLocaleString()}</p>
            <div className="mt-4 flex items-center gap-2 text-orange-100 text-xs font-medium bg-white/10 w-fit px-3 py-1 rounded-full">
              <Trophy className="w-3 h-3" /> PINGPONG CLUB JIU
            </div>
          </div>

          <div className="bg-slate-800/40 rounded-3xl p-7 border border-slate-700/50">
            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
              <Crown className="w-4 h-4 text-amber-500" /> Hall of Fame
            </h3>
            <div className="space-y-5">
              {leaderboard.map((team, idx) => (
                <div
                  key={team.id}
                  className="flex items-center justify-between group"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm ${idx === 0 ? "bg-amber-500 text-slate-900 shadow-lg shadow-amber-500/20" : "bg-slate-700 text-slate-400"}`}
                    >
                      {idx === 0 ? <Crown className="w-4 h-4" /> : idx + 1}
                    </div>
                    <p
                      className={`font-bold ${idx === 0 ? "text-white text-base" : "text-slate-400 text-sm"}`}
                    >
                      {team.name}
                    </p>
                  </div>
                  <div
                    className={`font-black ${idx === 0 ? "text-amber-500" : "text-slate-500 text-sm"}`}
                  >
                    {team.exp || 0}{" "}
                    <span className="text-[10px] ml-0.5 opacity-50">EXP</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
