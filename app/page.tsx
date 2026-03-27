"use client";

import {
  Target,
  Trophy,
  Zap,
  CheckCircle2,
  Circle,
  Flame,
  Users,
  Activity,
} from "lucide-react";
import { useState, useEffect } from "react";
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  increment,
  addDoc,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/lib/db";
import { useRouter } from "next/navigation";

export default function Dashboard() {
  const [quests, setQuests] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [weeklyExp, setWeeklyExp] = useState(0);

  // Fitur Admin & Modal
  const [isAdmin, setIsAdmin] = useState(false); // <--- Sekarang default-nya false (Member biasa)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newQuest, setNewQuest] = useState({
    title: "",
    difficulty: "Beginner",
    exp: 30,
    target: "Semua Tim",
  });

  const router = useRouter();
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (!user) {
        // Kalau belum login, lempar ke halaman login
        router.push("/login");
      } else {
        // Kalau sudah login, cek apakah emailnya adalah email Admin kamu?
        // PENTING: Ganti "admin@pingpong.com" dengan email yang kamu buat di Firebase!
        if (user.email === "admin@pingpong.com") {
          setIsAdmin(true); // Pintu Admin terbuka! Tombol +Buat Misi akan muncul.
        } else {
          setIsAdmin(false); // Mode Member biasa.
        }

        // Matikan animasi loading
        setIsAuthChecking(false);
      }
    });

    return () => unsubAuth();
  }, [router]);

  // 1. EFEK REAL-TIME (CCTV FIREBASE)
  useEffect(() => {
    if (!db) return;

    const unsubQuests = onSnapshot(collection(db, "quests"), (snapshot) => {
      const questsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setQuests(questsData);
    });

    const unsubLeaderboard = onSnapshot(collection(db, "teams"), (snapshot) => {
      const teamsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      const sortedTeams = teamsData.sort(
        (a: any, b: any) => (b.exp || 0) - (a.exp || 0),
      );
      setLeaderboard(sortedTeams);
    });

    const unsubStats = onSnapshot(doc(db, "club_stats", "weekly"), (doc) => {
      if (doc.exists()) {
        setWeeklyExp(doc.data().totalExp || 0);
      }
    });

    return () => {
      unsubQuests();
      unsubLeaderboard();
      unsubStats();
    };
  }, []);

  const completedCount = quests.filter((q) => q.completed).length;
  const totalCount = quests.length || 1;
  const progressPercent = Math.round((completedCount / totalCount) * 100);

  // 2. FUNGSI UPDATE MISI
  const toggleQuest = async (id: string, exp: number, isCompleted: boolean) => {
    try {
      const questRef = doc(db, "quests", id);
      await updateDoc(questRef, { completed: !isCompleted });

      const statsRef = doc(db, "club_stats", "weekly");
      await updateDoc(statsRef, {
        totalExp: increment(isCompleted ? -exp : exp),
      });
    } catch (error) {
      console.error("Gagal mengupdate misi:", error);
    }
  };

  // 3. FUNGSI TAMBAH MISI BARU (ADMIN)
  const handleAddQuest = async (e: any) => {
    e.preventDefault();
    if (!newQuest.title) return;

    try {
      await addDoc(collection(db, "quests"), {
        title: newQuest.title,
        difficulty: newQuest.difficulty,
        exp: Number(newQuest.exp),
        target: newQuest.target,
        completed: false,
        completedBy: [],
        createdAt: new Date().toISOString(),
      });

      setIsModalOpen(false);
      setNewQuest({
        title: "",
        difficulty: "Beginner",
        exp: 30,
        target: "Semua Tim",
      });
    } catch (error) {
      console.error("Gagal menambah misi:", error);
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

  return (
    <div className="p-8 lg:p-10 max-w-7xl mx-auto space-y-8 h-screen overflow-y-auto pb-24">
      {/* HEADER UTAMA */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight">
            Welcome back, Lindungi 👋
          </h2>
          <p className="text-slate-400 mt-2 text-sm font-medium">
            Sistem Data Real-time Aktif ⚡
          </p>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* KOLOM KIRI: DAFTAR MISI */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-800/40 rounded-3xl p-7 border border-slate-700/50 relative">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Target className="w-5 h-5 text-orange-500" />
                  Today's Training Overview
                </h3>
              </div>

              <div className="text-right flex items-center gap-4">
                {isAdmin && (
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-orange-600 hover:bg-orange-500 text-white px-4 py-2 rounded-xl text-sm font-bold transition-colors shadow-lg shadow-orange-500/20"
                  >
                    + Buat Misi
                  </button>
                )}
                <div className="flex flex-col items-end ml-2">
                  <span className="text-2xl font-bold text-white">
                    {progressPercent}%
                  </span>
                </div>
              </div>
            </div>

            <div className="h-2 w-full bg-slate-700/50 rounded-full mb-8 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-orange-400 to-orange-500 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <div className="space-y-3">
              {quests.length === 0 ? (
                <p className="text-slate-500 text-center py-4">
                  Belum ada misi. Tambahkan misi baru!
                </p>
              ) : (
                quests.map((quest) => (
                  <div
                    key={quest.id}
                    onClick={() =>
                      toggleQuest(quest.id, quest.exp, quest.completed)
                    }
                    className={
                      "group flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer " +
                      (quest.completed
                        ? "bg-slate-800/30 border-slate-700/50"
                        : "bg-slate-800/80 border-slate-600 hover:border-orange-500/50")
                    }
                  >
                    <div className="flex items-center gap-4">
                      <button
                        className={
                          "flex-shrink-0 transition-colors " +
                          (quest.completed
                            ? "text-emerald-500"
                            : "text-slate-500 group-hover:text-orange-400")
                        }
                      >
                        {quest.completed ? (
                          <CheckCircle2 className="w-6 h-6" />
                        ) : (
                          <Circle className="w-6 h-6" />
                        )}
                      </button>
                      <div>
                        <p
                          className={
                            "font-semibold transition-colors " +
                            (quest.completed
                              ? "text-slate-500 line-through decoration-slate-600"
                              : "text-slate-200")
                          }
                        >
                          {quest.title}
                        </p>
                        <span
                          className={
                            "inline-block text-[10px] font-bold px-2 py-0.5 rounded-md border mt-1 " +
                            getDifficultyColor(quest.difficulty)
                          }
                        >
                          {quest.difficulty}
                        </span>
                      </div>
                    </div>
                    <div
                      className={
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-sm transition-colors " +
                        (quest.completed
                          ? "bg-slate-800 text-slate-500"
                          : "bg-orange-500/10 border border-orange-500/20 text-orange-400")
                      }
                    >
                      <Zap className="w-4 h-4" /> +{quest.exp}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* KOLOM KANAN: STATS & LEADERBOARD */}
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl p-7 text-white shadow-xl relative overflow-hidden border border-slate-700/50">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-6">
              Quick Stats
            </h3>
            <p className="text-slate-400 text-xs font-medium mb-1">
              Weekly EXP Generated
            </p>
            <p className="text-4xl font-black text-white">
              {weeklyExp.toLocaleString()}
            </p>
          </div>

          <div className="bg-slate-800/40 rounded-3xl p-7 border border-slate-700/50">
            <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-6 flex items-center gap-2">
              <Trophy className="w-4 h-4 text-slate-500" /> Top Teams
            </h3>

            <div className="space-y-4">
              {leaderboard.length === 0 ? (
                <p className="text-slate-500 text-xs">Menunggu data tim...</p>
              ) : (
                leaderboard.map((team, idx) => (
                  <div
                    key={team.id}
                    className="flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-6 text-center font-bold text-sm text-amber-500">
                        #{idx + 1}
                      </div>
                      <p className="text-sm font-semibold text-slate-300">
                        {team.name}
                      </p>
                    </div>
                    <div className="text-sm font-bold text-slate-400">
                      {team.exp || 0}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* --- POP-UP MODAL BUAT MISI --- */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-8 w-full max-w-md shadow-2xl">
            <h3 className="text-2xl font-bold text-white mb-6">
              Upload Training Baru
            </h3>

            <form onSubmit={handleAddQuest} className="space-y-4">
              <div>
                <label className="block text-slate-400 text-sm font-medium mb-2">
                  Judul Latihan
                </label>
                <input
                  type="text"
                  value={newQuest.title}
                  onChange={(e) =>
                    setNewQuest({ ...newQuest, title: e.target.value })
                  }
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500"
                  placeholder="Contoh: Latihan Footwork"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 text-sm font-medium mb-2">
                    Tingkat Kesulitan
                  </label>
                  <select
                    value={newQuest.difficulty}
                    onChange={(e) =>
                      setNewQuest({ ...newQuest, difficulty: e.target.value })
                    }
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500"
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 text-sm font-medium mb-2">
                    Poin EXP
                  </label>
                  <input
                    type="number"
                    value={newQuest.exp}
                    onChange={(e) =>
                      setNewQuest({ ...newQuest, exp: Number(e.target.value) })
                    }
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 text-sm font-medium mb-2">
                  Target Misi
                </label>
                <select
                  value={newQuest.target}
                  onChange={(e) =>
                    setNewQuest({ ...newQuest, target: e.target.value })
                  }
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500"
                >
                  <option value="Semua Tim">Semua Tim</option>
                  <option value="Tim Spesifik">
                    Tim Spesifik (Fitur Segera Hadir)
                  </option>
                  <option value="Individu">
                    Individu (Fitur Segera Hadir)
                  </option>
                </select>
              </div>

              <div className="flex gap-3 mt-8">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-3 rounded-xl font-bold text-slate-300 bg-slate-800 hover:bg-slate-700 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 rounded-xl font-bold text-white bg-orange-600 hover:bg-orange-500 transition-colors"
                >
                  Upload Misi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
