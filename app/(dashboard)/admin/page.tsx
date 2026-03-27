// app/(dashboard)/admin/page.tsx

"use client";

import {
  ShieldAlert,
  Loader2,
  UserPlus,
  Trophy,
  Crown,
  Check,
  X,
  Target,
  Users,
  ArrowRight,
} from "lucide-react";
import { useState, useEffect } from "react";
import {
  collection,
  onSnapshot,
  doc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/lib/db";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Member {
  id: string;
  name?: string;
  email?: string;
  teamId?: string | null;
  exp?: number;
}

export default function AdminDashboardOverview() {
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [weeklyExp, setWeeklyExp] = useState(0);
  const [allMembers, setAllMembers] = useState<Member[]>([]); // State untuk semua member
  const [availableMembers, setAvailableMembers] = useState<Member[]>([]); // State untuk member tanpa tim

  // Auth & Admin State
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [adminName, setAdminName] = useState("Admin");

  // Modals State
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);

  // Form State untuk membuat tim
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);

  const router = useRouter();
  const ADMIN_EMAIL = "rahmalindungilaowo380@gmail.com"; // Email Admin Kamu

  // --- 1. PROTEKSI ADMIN & STATUS AUTH ---
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.push("/login");
        return;
      }

      const safeEmail = user.email || "";

      if (safeEmail !== ADMIN_EMAIL) {
        // Kick out non-admins ke portal
        router.push("/portal");
      } else {
        const extractedName = safeEmail.split("@")[0];
        setAdminName(
          extractedName.charAt(0).toUpperCase() + extractedName.slice(1),
        );
        setIsAuthChecking(false);
      }
    });
    return () => unsubAuth();
  }, [router]);

  // --- 2. DATA REAL-TIME (FIRESTORE SNAPS) ---
  useEffect(() => {
    if (!db || isAuthChecking) return;

    // A. Listen ke semua user untuk memfilter yang tersedia
    const unsubAllUsers = onSnapshot(collection(db, "users"), (snapshot) => {
      const membersData = snapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
          }) as Member,
      );
      setAllMembers(membersData);
      // Filter untuk free agent (tidak ada teamId)
      const freeAgents = membersData.filter((m) => !m.teamId);
      setAvailableMembers(freeAgents);
    });

    // B. Listen ke semua tim untuk leaderboard
    const unsubLeaderboard = onSnapshot(collection(db, "teams"), (snapshot) => {
      const teamsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setLeaderboard(
        teamsData.sort((a: any, b: any) => (b.exp || 0) - (a.exp || 0)),
      );
    });

    // C. Listen ke statistik mingguan global
    const unsubStats = onSnapshot(
      doc(db, "club_stats", "weekly"),
      (docSnap) => {
        if (docSnap.exists()) setWeeklyExp(docSnap.data().totalExp || 0);
      },
    );

    return () => {
      unsubAllUsers();
      unsubLeaderboard();
      unsubStats();
    };
  }, [isAuthChecking]);

  // Menangani pemilihan member di dalam modal
  const handleMemberSelection = (memberId: string) => {
    if (selectedMembers.includes(memberId)) {
      // Batal pilih jika sudah dipilih
      setSelectedMembers(selectedMembers.filter((id) => id !== memberId));
    } else if (selectedMembers.length < 2) {
      // Pilih hanya jika kurang dari 2 yang dipilih
      setSelectedMembers([...selectedMembers, memberId]);
    }
    // Tidak melakukan apa-apa jika mencoba memilih member ke-3
  };

  // --- 3. FUNGSI ADMIN: BUAT TIM DUO ---
  const handleCreateDuo = async () => {
    if (selectedMembers.length !== 2) return;

    // Otomatis gabung nama (misal: "Natanael & Rahma")
    const teamName = selectedMembers.join(" & ");

    try {
      // 1. Buat dokumen tim
      await setDoc(doc(db, "teams", teamName), {
        name: teamName,
        members: selectedMembers,
        exp: 0,
        createdAt: serverTimestamp(),
      });

      // 2. Perbarui dokumen user setiap member dengan teamId baru
      for (const mName of selectedMembers) {
        await updateDoc(doc(db, "users", mName), { teamId: teamName });
      }

      // 3. Bersihkan state, tutup modal, dan beritahu
      setIsTeamModalOpen(false);
      setSelectedMembers([]);
      alert(`Duo ${teamName} Siap Bertanding! 🏓`);
    } catch (err) {
      console.error(err);
      alert("Gagal membuat tim.");
    }
  };

  if (isAuthChecking)
    return (
      <div className="h-screen bg-slate-950 flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
        <p className="text-slate-500 font-bold uppercase text-xs tracking-widest">
          Otorisasi Ruang Admin...
        </p>
      </div>
    );

  return (
    <div className="p-8 lg:p-10 max-w-7xl mx-auto space-y-8 h-screen overflow-y-auto pb-24 scrollbar-hide">
      {/* HEADER KHUSUS ADMIN */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            Admin Overview <ShieldAlert className="w-6 h-6 text-rose-500" />
          </h2>
          <p className="text-slate-400 mt-2">
            Selamat datang komandan {adminName}. Ini adalah ringkasan performa
            klub.
          </p>
        </div>
      </section>

      {/* SECTION QUICK ACTIONS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <button
          onClick={() => setIsTeamModalOpen(true)}
          className="bg-slate-800/60 hover:bg-slate-700/80 border border-slate-700 p-6 rounded-3xl transition-all flex flex-col items-start gap-4 group"
        >
          <div className="w-12 h-12 bg-orange-500/10 text-orange-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
            <UserPlus className="w-6 h-6" />
          </div>
          <div className="text-left">
            <h3 className="text-white font-bold text-lg">Bentuk Tim Duo</h3>
            <p className="text-slate-400 text-sm mt-1">
              Gabungkan 2 Free Agents menjadi satu tim.
            </p>
          </div>
        </button>

        <Link
          href="/admin/quests"
          className="bg-slate-800/60 hover:bg-slate-700/80 border border-slate-700 p-6 rounded-3xl transition-all flex flex-col items-start gap-4 group"
        >
          <div className="w-12 h-12 bg-indigo-500/10 text-indigo-400 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
            <Target className="w-6 h-6" />
          </div>
          <div className="text-left w-full flex items-center justify-between">
            <div>
              <h3 className="text-white font-bold text-lg">Kelola Misi</h3>
              <p className="text-slate-400 text-sm mt-1">
                Atur jadwal & target latihan.
              </p>
            </div>
            <ArrowRight className="w-5 h-5 text-slate-500 group-hover:text-white transition-colors" />
          </div>
        </Link>

        <Link
          href="/admin/members"
          className="bg-slate-800/60 hover:bg-slate-700/80 border border-slate-700 p-6 rounded-3xl transition-all flex flex-col items-start gap-4 group"
        >
          <div className="w-12 h-12 bg-emerald-500/10 text-emerald-400 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
            <Users className="w-6 h-6" />
          </div>
          <div className="text-left w-full flex items-center justify-between">
            <div>
              <h3 className="text-white font-bold text-lg">Data Member</h3>
              <p className="text-slate-400 text-sm mt-1">
                Lihat roster dan status anggota.
              </p>
            </div>
            <ArrowRight className="w-5 h-5 text-slate-500 group-hover:text-white transition-colors" />
          </div>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-4">
        {/* TOTAL EXP CLUB WIDGET */}
        <div className="bg-gradient-to-br from-orange-500 to-orange-700 rounded-3xl p-8 text-white shadow-xl shadow-orange-500/10 flex flex-col justify-center relative overflow-hidden">
          <div className="absolute -right-10 -bottom-10 opacity-20">
            <Trophy className="w-64 h-64" />
          </div>
          <div className="relative z-10">
            <h3 className="text-xs font-bold text-orange-200 uppercase tracking-widest mb-4">
              Total EXP Global Minggu Ini
            </h3>
            <p className="text-6xl md:text-7xl font-black tracking-tighter">
              {weeklyExp.toLocaleString()}
            </p>
            <div className="mt-6 flex items-center gap-2 text-orange-100 text-sm font-medium bg-white/10 w-fit px-4 py-2 rounded-full backdrop-blur-sm">
              <Trophy className="w-4 h-4" /> PINGPONG CLUB JIU
            </div>
          </div>
        </div>

        {/* HALL OF FAME WIDGET */}
        <div className="bg-slate-800/40 rounded-3xl p-8 border border-slate-700/50">
          <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
            <Crown className="w-5 h-5 text-amber-500" /> Hall of Fame (Top
            Teams)
          </h3>

          {leaderboard.length === 0 ? (
            <p className="text-slate-500 text-sm py-4">
              Belum ada tim yang terbentuk.
            </p>
          ) : (
            <div className="space-y-5">
              {leaderboard.slice(0, 5).map((team, idx) => (
                <div
                  key={team.id}
                  className="flex items-center justify-between group"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-base ${idx === 0 ? "bg-amber-500 text-slate-900 shadow-lg shadow-amber-500/20" : idx === 1 ? "bg-slate-300 text-slate-800" : idx === 2 ? "bg-amber-700/50 text-amber-200" : "bg-slate-700 text-slate-400"}`}
                    >
                      {idx === 0 ? <Crown className="w-5 h-5" /> : idx + 1}
                    </div>
                    <div>
                      <p
                        className={`font-bold ${idx === 0 ? "text-white text-lg" : "text-slate-300 text-base"}`}
                      >
                        {team.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {team.members?.join(" & ")}
                      </p>
                    </div>
                  </div>
                  <div
                    className={`font-black ${idx === 0 ? "text-amber-500 text-xl" : "text-slate-400 text-lg"}`}
                  >
                    {team.exp || 0}{" "}
                    <span className="text-[10px] ml-0.5 opacity-50">EXP</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* --- MODAL 2: BENTUK TIM DUO --- */}
      {isTeamModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-10 w-full max-w-md shadow-2xl relative">
            <button
              onClick={() => setIsTeamModalOpen(false)}
              className="absolute top-8 right-8 text-slate-500 hover:text-white transition-colors"
            >
              <X />
            </button>
            <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">
              Bentuk Tim Duo
            </h3>
            <p className="text-slate-500 text-xs mb-8 mt-1">
              Pilih 2 orang yang belum punya tim dari database.
            </p>

            <div className="grid grid-cols-2 gap-3 mb-8 max-h-52 overflow-y-auto pr-2 custom-scrollbar">
              {availableMembers.length === 0 ? (
                <div className="col-span-2 text-center text-slate-500 italic text-sm py-4">
                  Semua member sudah punya tim.
                </div>
              ) : (
                availableMembers.map((m) => {
                  const isSelected = selectedMembers.includes(m.id);
                  return (
                    <div
                      key={m.id}
                      onClick={() => handleMemberSelection(m.id)}
                      className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? "bg-orange-600 border-orange-600 text-white shadow-lg shadow-orange-600/20"
                          : "bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500"
                      }`}
                    >
                      <span className="text-xs font-bold uppercase truncate">
                        {m.id}
                      </span>
                      {isSelected && <Check className="w-4 h-4 text-white" />}
                    </div>
                  );
                })
              )}
            </div>

            <button
              onClick={handleCreateDuo}
              disabled={selectedMembers.length !== 2}
              className={`w-full py-4 rounded-2xl font-black text-sm transition-all ${
                selectedMembers.length === 2
                  ? "bg-white text-black hover:bg-orange-500 hover:text-white"
                  : "bg-slate-800 text-slate-600 opacity-50 cursor-not-allowed"
              }`}
            >
              {selectedMembers.length === 2
                ? "KONFIRMASI DUO 🚀"
                : `PILIH ${2 - selectedMembers.length} ORANG LAGI`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
