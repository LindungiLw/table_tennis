"use client";

import {
  Target,
  Zap,
  CheckCircle2,
  Circle,
  User,
  Loader2,
  ShieldAlert,
  Clock,
  AlertCircle, // <-- Tambahan icon
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
  serverTimestamp,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/lib/db";
import { useRouter } from "next/navigation";

export default function PortalArenaPage() {
  const [quests, setQuests] = useState<any[]>([]);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [userName, setUserName] = useState("Pemain");
  const [userTeam, setUserTeam] = useState<string | null>(null);
  const [userExp, setUserExp] = useState(0);

  const router = useRouter();
  const ADMIN_EMAIL = "rahmalindungilaowo380@gmail.com";

  // --- 1. PROTEKSI RUTE ---
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

  // --- 2. REAL-TIME DATA ---
  useEffect(() => {
    if (!db || isAuthChecking || !userName) return;

    const unsubUser = onSnapshot(doc(db, "users", userName), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setUserTeam(data.teamId || null);
        setUserExp(data.exp || 0);
      }
    });

    const unsubQuests = onSnapshot(collection(db, "quests"), (snapshot) => {
      const questsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Filter: Hanya tampilkan misi yang target timnya cocok
      // (Kita tidak lagi menyembunyikan yang kedaluwarsa, tapi kita tampilkan sebagai "Waktu Habis" supaya member tahu mereka melewatkannya)
      const filteredQuests = questsData.filter((q: any) => {
        return q.targetTeam === "Semua Tim" || q.targetTeam === userTeam;
      });

      setQuests(
        filteredQuests.sort(
          (a: any, b: any) =>
            (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0),
        ),
      );
    });

    return () => {
      unsubUser();
      unsubQuests();
    };
  }, [isAuthChecking, userName, userTeam]);

  // --- 3. FUNGSI KLAIM EXP (DENGAN VALIDASI WAKTU KETAT) ---
  const handleCompleteQuest = async (
    questId: string,
    questExp: number,
    deadline: string | null,
  ) => {
    // KEAMANAN LOGIC: Cek waktu detik ini juga saat tombol dipencet!
    if (deadline) {
      const now = new Date();
      const deadlineDate = new Date(deadline);
      if (now > deadlineDate) {
        alert("Maaf, waktu untuk menyelesaikan misi ini sudah habis! 🕒");
        return; // Hentikan proses, jangan tambah EXP!
      }
    }

    try {
      await updateDoc(doc(db, "quests", questId), {
        completedBy: arrayUnion(userName),
      });
      await updateDoc(doc(db, "users", userName), {
        exp: increment(questExp),
        lastExpUpdate: serverTimestamp(),
      });
      if (userTeam) {
        await updateDoc(doc(db, "teams", userTeam), {
          exp: increment(questExp),
          lastExpUpdate: serverTimestamp(),
        });
      }
      await setDoc(
        doc(db, "club_stats", "weekly"),
        { totalExp: increment(questExp) },
        { merge: true },
      );
      alert(`Mantap ${userName}! +${questExp} EXP berhasil diklaim!`);
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

  const formatDeadline = (isoString: string) => {
    if (!isoString) return null;
    const date = new Date(isoString);
    return date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
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

  // Waktu saat ini untuk dirender di UI
  const now = new Date();

  return (
    <div className="p-8 lg:p-10 max-w-7xl mx-auto space-y-8 h-screen overflow-y-auto pb-24 scrollbar-hide">
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-6 bg-slate-800/40 p-8 rounded-3xl border border-slate-700/50">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight">
            Welcome back, <span className="text-orange-500">{userName}</span> 👋
          </h2>
          <p className="text-slate-400 mt-2 text-sm">
            Selesaikan program latihan di bawah ini sebelum batas waktunya
            habis!
          </p>
          <div className="flex flex-wrap items-center gap-3 mt-5">
            <span className="text-xs font-bold text-slate-400 bg-slate-900 border border-slate-700 px-4 py-2 rounded-xl flex items-center gap-2">
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
            <span className="text-xs font-bold text-orange-400 bg-orange-500/10 border border-orange-500/20 px-4 py-2 rounded-xl flex items-center gap-2">
              <User className="w-4 h-4" /> Personal EXP: {userExp}
            </span>
          </div>
        </div>
      </section>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-white flex items-center gap-3">
            <Target className="w-6 h-6 text-orange-500" /> Available Training
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quests.length === 0 ? (
            <div className="md:col-span-2 lg:col-span-3 p-12 border border-slate-700/50 rounded-3xl text-center bg-slate-800/20">
              <ShieldAlert className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-500 font-medium">
                Belum ada jadwal latihan untuk timmu saat ini.
              </p>
            </div>
          ) : (
            quests.map((quest) => {
              const isClaimed = quest.completedBy?.includes(userName);
              const isExpired =
                quest.deadline && new Date(quest.deadline) < now;
              const deadlineText = formatDeadline(quest.deadline);

              return (
                <div
                  key={quest.id}
                  className={`group flex flex-col justify-between p-6 rounded-3xl border transition-all ${isClaimed || isExpired ? "bg-slate-900/40 border-slate-800 opacity-60" : "bg-slate-800/60 border-slate-700 hover:border-orange-500/40 hover:-translate-y-1 shadow-lg"}`}
                >
                  <div>
                    <div className="flex justify-between items-start mb-5">
                      <div className="flex flex-wrap gap-2">
                        <span
                          className={`inline-block text-[10px] font-black px-2.5 py-1 rounded-md border uppercase ${getDifficultyColor(quest.difficulty)}`}
                        >
                          {quest.difficulty}
                        </span>
                        {quest.targetTeam !== "Semua Tim" && (
                          <span className="text-[10px] font-bold text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-md border border-indigo-500/20 uppercase">
                            {quest.targetTeam}
                          </span>
                        )}
                        {/* WIDGET DEADLINE */}
                        {deadlineText && !isClaimed && !isExpired && (
                          <span className="text-[10px] font-bold text-orange-400 bg-orange-500/10 px-2.5 py-1 rounded-md border border-orange-500/20 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {deadlineText}
                          </span>
                        )}
                        {/* WIDGET KEDALUWARSA */}
                        {isExpired && !isClaimed && (
                          <span className="text-[10px] font-bold text-rose-500 bg-rose-500/10 px-2.5 py-1 rounded-md border border-rose-500/20 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" /> Waktu Habis
                          </span>
                        )}
                      </div>
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
                    </div>

                    <p
                      className={`font-bold text-xl leading-snug ${isClaimed || isExpired ? "text-slate-500 line-through" : "text-white"}`}
                    >
                      {quest.title}
                    </p>
                  </div>

                  <div className="mt-8 pt-5 border-t border-slate-700/50 flex items-center justify-between">
                    <span
                      className={`text-sm font-black flex items-center gap-1.5 ${isExpired && !isClaimed ? "text-slate-600" : "text-orange-400"}`}
                    >
                      <Zap
                        className={`w-4 h-4 ${isExpired && !isClaimed ? "fill-slate-600" : "fill-orange-400"}`}
                      />{" "}
                      {quest.exp} EXP
                    </span>

                    {/* RENDER TOMBOL BERDASARKAN STATUS */}
                    {isClaimed ? (
                      <span className="text-xs font-bold text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-4 py-2.5 rounded-xl flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" /> Selesai
                      </span>
                    ) : isExpired ? (
                      <span className="text-xs font-bold text-rose-500 bg-rose-500/10 border border-rose-500/20 px-4 py-2.5 rounded-xl flex items-center gap-1.5 cursor-not-allowed">
                        <AlertCircle className="w-4 h-4" /> Kedaluwarsa
                      </span>
                    ) : (
                      <button
                        onClick={() =>
                          handleCompleteQuest(
                            quest.id,
                            quest.exp,
                            quest.deadline,
                          )
                        }
                        className="bg-orange-600 hover:bg-orange-500 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-lg shadow-orange-600/20 active:scale-95"
                      >
                        Klaim Latihan
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
