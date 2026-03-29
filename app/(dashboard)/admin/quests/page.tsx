"use client";

import { useState, useEffect } from "react";
import {
  collection,
  onSnapshot,
  doc,
  addDoc,
  deleteDoc,
  updateDoc, // <-- Tambahan untuk update data
  serverTimestamp,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/lib/db";
import { useRouter } from "next/navigation";
import {
  Target,
  ShieldAlert,
  Loader2,
  Plus,
  Trash2,
  X,
  Activity,
  Zap,
  Users,
  Clock,
  AlertCircle,
  Unlock, // <-- Tambahan icon untuk Buka Kembali
} from "lucide-react";

export default function AdminQuestsPage() {
  const [quests, setQuests] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  // Modal State Buat Misi
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newQuest, setNewQuest] = useState({
    title: "",
    difficulty: "Beginner",
    exp: 30,
    targetTeam: "Semua Tim",
    deadline: "",
  });

  // Modal State Buka Waktu (Edit Deadline)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingQuest, setEditingQuest] = useState<any>(null);
  const [newDeadline, setNewDeadline] = useState("");

  const router = useRouter();
  const ADMIN_EMAIL = "rahmalindungilaowo380@gmail.com";

  // --- 1. PROTEKSI RUANG ADMIN ---
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.push("/login");
        return;
      }
      const amanEmail = user.email || "";
      if (amanEmail !== ADMIN_EMAIL) {
        router.push("/portal");
      } else {
        setIsAuthChecking(false);
      }
    });
    return () => unsub();
  }, [router]);

  // --- 2. TARIK DATA MISI & TIM ---
  useEffect(() => {
    if (!db || isAuthChecking) return;

    const unsubQuests = onSnapshot(collection(db, "quests"), (snapshot) => {
      const questsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setQuests(
        questsData.sort(
          (a: any, b: any) =>
            (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0),
        ),
      );
    });

    const unsubTeams = onSnapshot(collection(db, "teams"), (snapshot) => {
      setTeams(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubQuests();
      unsubTeams();
    };
  }, [isAuthChecking]);

  // --- 3. FUNGSI ADMIN ---
  const handleAddQuest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuest.title) return;

    try {
      await addDoc(collection(db, "quests"), {
        ...newQuest,
        exp: Number(newQuest.exp),
        deadline: newQuest.deadline || null,
        completedBy: [],
        createdAt: serverTimestamp(),
      });
      setIsModalOpen(false);
      setNewQuest({
        title: "",
        difficulty: "Beginner",
        exp: 30,
        targetTeam: "Semua Tim",
        deadline: "",
      });
      alert("Latihan baru berhasil di-deploy ke arena! 🏓");
    } catch (error) {
      console.error(error);
      alert("Gagal mengupload latihan.");
    }
  };

  const handleDeleteQuest = async (id: string) => {
    if (confirm("Hapus latihan ini dari database?")) {
      try {
        await deleteDoc(doc(db, "quests", id));
      } catch (error) {
        console.error(error);
        alert("Gagal menghapus latihan.");
      }
    }
  };

  // Fungsi Baru: Update Batas Waktu
  const handleUpdateDeadline = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingQuest) return;

    try {
      await updateDoc(doc(db, "quests", editingQuest.id), {
        deadline: newDeadline || null, // Jika dikosongkan, batas waktu dihapus (berlaku selamanya)
      });
      setIsEditModalOpen(false);
      setEditingQuest(null);
      setNewDeadline("");
      alert("Batas waktu berhasil diperbarui! Misi terbuka kembali. 🔓");
    } catch (error) {
      console.error(error);
      alert("Gagal memperbarui batas waktu.");
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

  if (isAuthChecking) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-4 bg-slate-950">
        <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
        <p className="text-slate-500 font-bold uppercase text-xs tracking-widest">
          Membuka Gudang Senjata...
        </p>
      </div>
    );
  }

  const now = new Date();

  return (
    <div className="p-8 lg:p-10 max-w-7xl mx-auto space-y-8 h-screen overflow-y-auto pb-24 scrollbar-hide">
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            Kelola Latihan <ShieldAlert className="w-6 h-6 text-rose-500" />
          </h2>
          <p className="text-slate-400 mt-2">
            Buat, pantau, dan atur batas waktu latihan untuk anggota club.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-orange-600 hover:bg-orange-500 text-white px-6 py-3 rounded-xl text-sm font-bold transition-all flex items-center gap-2 shadow-lg shadow-orange-500/20"
        >
          <Plus className="w-5 h-5" /> Buat Latihan Baru
        </button>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-800/40 border border-slate-700/50 p-6 rounded-3xl flex items-center gap-5">
          <div className="w-14 h-14 bg-indigo-500/10 text-indigo-400 rounded-2xl flex items-center justify-center">
            <Target className="w-7 h-7" />
          </div>
          <div>
            <p className="text-slate-400 text-sm font-bold">
              Total Latihan Dibuat
            </p>
            <p className="text-3xl font-black text-white">{quests.length}</p>
          </div>
        </div>
        <div className="bg-slate-800/40 border border-slate-700/50 p-6 rounded-3xl flex items-center gap-5">
          <div className="w-14 h-14 bg-emerald-500/10 text-emerald-400 rounded-2xl flex items-center justify-center">
            <Activity className="w-7 h-7" />
          </div>
          <div>
            <p className="text-slate-400 text-sm font-bold">Latihan Beginner</p>
            <p className="text-3xl font-black text-white">
              {quests.filter((q) => q.difficulty === "Beginner").length}
            </p>
          </div>
        </div>
        <div className="bg-slate-800/40 border border-slate-700/50 p-6 rounded-3xl flex items-center gap-5">
          <div className="w-14 h-14 bg-rose-500/10 text-rose-400 rounded-2xl flex items-center justify-center">
            <Zap className="w-7 h-7" />
          </div>
          <div>
            <p className="text-slate-400 text-sm font-bold">Latihan Hard</p>
            <p className="text-3xl font-black text-white">
              {quests.filter((q) => q.difficulty === "Hard").length}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {quests.length === 0 ? (
          <div className="bg-slate-800/40 border border-slate-700/50 rounded-3xl p-10 text-center">
            <Target className="w-12 h-12 text-slate-600 mx-auto mb-4 opacity-50" />
            <p className="text-slate-400 font-medium">
              Belum ada jadwal latihan. Klik tombol "Buat Latihan Baru" untuk
              memulai.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {quests.map((quest) => {
              const isExpired =
                quest.deadline && new Date(quest.deadline) < now;
              const deadlineText = formatDeadline(quest.deadline);

              return (
                <div
                  key={quest.id}
                  className={`border p-6 rounded-3xl transition-colors flex flex-col h-full group ${
                    isExpired
                      ? "bg-slate-900/80 border-rose-900/30 opacity-80"
                      : "bg-slate-800/60 border-slate-700 hover:border-orange-500/40"
                  }`}
                >
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex flex-wrap gap-2">
                        <span
                          className={`inline-block text-[10px] font-black px-2.5 py-1 rounded-md border uppercase ${getDifficultyColor(quest.difficulty)}`}
                        >
                          {quest.difficulty}
                        </span>
                        {isExpired && (
                          <span className="inline-block text-[10px] font-black px-2.5 py-1 rounded-md border uppercase text-white bg-rose-600 border-rose-500 flex items-center gap-1 shadow-lg shadow-rose-600/20">
                            <AlertCircle className="w-3 h-3" /> Kedaluwarsa
                          </span>
                        )}
                      </div>

                      {/* ACTION BUTTONS (Edit & Delete) */}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setEditingQuest(quest);
                            setNewDeadline(quest.deadline || "");
                            setIsEditModalOpen(true);
                          }}
                          className="text-slate-500 hover:text-emerald-400 transition-colors p-1"
                          title="Buka Kembali / Ubah Batas Waktu"
                        >
                          <Unlock className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteQuest(quest.id)}
                          className="text-slate-500 hover:text-rose-500 transition-colors p-1"
                          title="Hapus Latihan"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <h3
                      className={`text-xl font-bold mb-2 leading-snug ${isExpired ? "text-slate-500 line-through" : "text-white"}`}
                    >
                      {quest.title}
                    </h3>

                    {deadlineText && !isExpired && (
                      <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-2 font-medium">
                        <Clock className="w-3.5 h-3.5 text-rose-400" />
                        Batas: {deadlineText}
                      </div>
                    )}

                    <div className="flex items-center gap-2 text-sm text-slate-400 mt-4 bg-slate-900/50 p-3 rounded-xl border border-slate-800">
                      <Users className="w-4 h-4 text-indigo-400" />
                      <span className="font-medium truncate">
                        {quest.targetTeam}
                      </span>
                    </div>
                  </div>

                  <div className="mt-6 pt-5 border-t border-slate-700/50 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500 font-medium">
                        Selesai:
                      </span>
                      <span className="text-sm font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                        {quest.completedBy?.length || 0} orang
                      </span>
                    </div>
                    <span className="text-sm font-black text-orange-400 flex items-center gap-1">
                      <Zap className="w-4 h-4 fill-orange-400" /> {quest.exp}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* --- MODAL FORM BUAT MISI --- */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-[2rem] p-8 md:p-10 w-full max-w-md shadow-2xl relative animate-in fade-in zoom-in duration-200">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-6 right-6 text-slate-500 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            <h3 className="text-2xl font-black text-white mb-6 flex items-center gap-3">
              <Target className="w-6 h-6 text-orange-500" /> Buat Latihan Baru
            </h3>
            <form onSubmit={handleAddQuest} className="space-y-4">
              <div>
                <label className="text-slate-500 text-xs font-bold uppercase ml-1">
                  Judul Latihan
                </label>
                <input
                  type="text"
                  value={newQuest.title}
                  onChange={(e) =>
                    setNewQuest({ ...newQuest, title: e.target.value })
                  }
                  className="w-full bg-slate-800 border-2 border-slate-700 rounded-2xl px-5 py-3.5 text-white focus:outline-none focus:border-orange-500 transition-all mt-1"
                  placeholder="Contoh: 100x Forehand Drive"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-500 text-xs font-bold uppercase ml-1">
                    Kesulitan
                  </label>
                  <select
                    value={newQuest.difficulty}
                    onChange={(e) =>
                      setNewQuest({ ...newQuest, difficulty: e.target.value })
                    }
                    className="w-full bg-slate-800 border-2 border-slate-700 rounded-2xl px-4 py-3.5 text-white focus:outline-none focus:border-orange-500 mt-1"
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-500 text-xs font-bold uppercase ml-1">
                    Reward EXP
                  </label>
                  <input
                    type="number"
                    value={newQuest.exp}
                    onChange={(e) =>
                      setNewQuest({ ...newQuest, exp: Number(e.target.value) })
                    }
                    className="w-full bg-slate-800 border-2 border-slate-700 rounded-2xl px-4 py-3.5 text-white focus:outline-none focus:border-orange-500 mt-1"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="text-slate-500 text-xs font-bold uppercase ml-1">
                  Target Tim
                </label>
                <select
                  value={newQuest.targetTeam}
                  onChange={(e) =>
                    setNewQuest({ ...newQuest, targetTeam: e.target.value })
                  }
                  className="w-full bg-slate-800 border-2 border-slate-700 rounded-2xl px-5 py-3.5 text-white focus:outline-none focus:border-orange-500 mt-1"
                >
                  <option value="Semua Tim">📢 Semua Tim</option>
                  {teams.map((t) => (
                    <option key={t.id} value={t.name}>
                      🛡️ {t.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-slate-500 text-xs font-bold uppercase ml-1">
                  Batas Waktu (Opsional)
                </label>
                <input
                  type="datetime-local"
                  value={newQuest.deadline}
                  onChange={(e) =>
                    setNewQuest({ ...newQuest, deadline: e.target.value })
                  }
                  className="w-full bg-slate-800 border-2 border-slate-700 rounded-2xl px-5 py-3.5 text-white focus:outline-none focus:border-orange-500 mt-1 [color-scheme:dark]"
                />
                <p className="text-[10px] text-slate-500 mt-1 ml-1">
                  Kosongkan jika latihan berlaku selamanya.
                </p>
              </div>
              <button
                type="submit"
                className="w-full bg-orange-600 hover:bg-orange-500 py-4 mt-6 rounded-2xl font-black text-white transition-all shadow-xl shadow-orange-600/20"
              >
                🚀 Upload ke Arena
              </button>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL EDIT BATAS WAKTU (BARU) --- */}
      {isEditModalOpen && editingQuest && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-[2rem] p-8 md:p-10 w-full max-w-sm shadow-2xl relative animate-in fade-in zoom-in duration-200">
            <button
              onClick={() => {
                setIsEditModalOpen(false);
                setEditingQuest(null);
              }}
              className="absolute top-6 right-6 text-slate-500 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            <h3 className="text-2xl font-black text-white mb-2 flex items-center gap-3">
              <Unlock className="w-6 h-6 text-emerald-500" /> Buka Waktu
            </h3>
            <p className="text-slate-400 text-sm mb-6">
              Perbarui tenggat waktu untuk misi{" "}
              <strong className="text-white">"{editingQuest.title}"</strong>.
            </p>

            <form onSubmit={handleUpdateDeadline} className="space-y-4">
              <div>
                <label className="text-slate-500 text-xs font-bold uppercase ml-1">
                  Batas Waktu Baru
                </label>
                <input
                  type="datetime-local"
                  value={newDeadline}
                  onChange={(e) => setNewDeadline(e.target.value)}
                  className="w-full bg-slate-800 border-2 border-slate-700 rounded-2xl px-5 py-3.5 text-white focus:outline-none focus:border-emerald-500 mt-1 [color-scheme:dark]"
                />
                <p className="text-[10px] text-slate-500 mt-2 ml-1">
                  *Kosongkan kolom ini jika kamu ingin misi ini terbuka{" "}
                  <strong>selamanya</strong> tanpa kedaluwarsa.
                </p>
              </div>

              <button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-500 py-4 mt-6 rounded-2xl font-black text-white transition-all shadow-xl shadow-emerald-600/20"
              >
                Simpan & Buka 🔓
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
