"use client";

import { useState, useEffect } from "react";
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/lib/db";
import { useRouter } from "next/navigation";
import {
  Users,
  ShieldAlert,
  Loader2,
  Trophy,
  UserMinus,
  UserX,
  User,
} from "lucide-react";

export default function AdminMembersPage() {
  const [members, setMembers] = useState<any[]>([]);
  const [isAuthChecking, setIsAuthChecking] = useState(true);

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
        router.push("/portal"); // Tendang member biasa jika iseng masuk sini
      } else {
        setIsAuthChecking(false);
      }
    });
    return () => unsub();
  }, [router]);

  // --- 2. TARIK DATA SEMUA MEMBER DARI FIREBASE ---
  useEffect(() => {
    if (!db || isAuthChecking) return;

    const unsub = onSnapshot(collection(db, "users"), (snapshot) => {
      const membersData = snapshot.docs.map((doc) => ({
        id: doc.id, // ID dokumen adalah nama member
        ...doc.data(),
      }));
      // Urutkan otomatis berdasarkan EXP tertinggi
      setMembers(
        membersData.sort((a: any, b: any) => (b.exp || 0) - (a.exp || 0)),
      );
    });

    return () => unsub();
  }, [isAuthChecking]);

  // --- 3. FUNGSI ADMIN: RESET TIM & HAPUS MEMBER ---
  const handleRemoveFromTeam = async (userId: string) => {
    if (confirm(`Keluarkan ${userId} dari timnya saat ini?`)) {
      try {
        await updateDoc(doc(db, "users", userId), { teamId: null });
        alert(`${userId} sekarang menjadi Free Agent.`);
      } catch (error) {
        console.error(error);
        alert("Gagal mengeluarkan member dari tim.");
      }
    }
  };

  const handleDeleteMember = async (userId: string) => {
    if (
      confirm(
        `HAPUS PERMANEN data ${userId}? Tindakan ini tidak bisa dibatalkan.`,
      )
    ) {
      try {
        await deleteDoc(doc(db, "users", userId));
        alert(`Data ${userId} berhasil dihapus dari database.`);
      } catch (error) {
        console.error(error);
        alert("Gagal menghapus data member.");
      }
    }
  };

  // Statistik Cepat untuk Admin
  const totalMembers = members.length;
  const freeAgents = members.filter((m) => !m.teamId).length;

  if (isAuthChecking) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-4 bg-slate-950">
        <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
        <p className="text-slate-500 font-bold uppercase text-xs tracking-widest">
          Otorisasi Ruang Admin...
        </p>
      </div>
    );
  }

  return (
    <div className="p-8 lg:p-10 max-w-7xl mx-auto space-y-8 h-screen overflow-y-auto pb-24 scrollbar-hide">
      {/* HEADER */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            Data Anggota <ShieldAlert className="w-6 h-6 text-rose-500" />
          </h2>
          <p className="text-slate-400 mt-2">
            Pantau dan kelola seluruh anggota Pingpong Club JIU.
          </p>
        </div>
      </section>

      {/* STATISTIK CEPAT */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-slate-800/40 border border-slate-700/50 p-6 rounded-3xl flex items-center gap-5">
          <div className="w-14 h-14 bg-blue-500/10 text-blue-500 rounded-2xl flex items-center justify-center">
            <Users className="w-7 h-7" />
          </div>
          <div>
            <p className="text-slate-400 text-sm font-bold">Total Anggota</p>
            <p className="text-3xl font-black text-white">{totalMembers}</p>
          </div>
        </div>
        <div className="bg-slate-800/40 border border-slate-700/50 p-6 rounded-3xl flex items-center gap-5">
          <div className="w-14 h-14 bg-emerald-500/10 text-emerald-500 rounded-2xl flex items-center justify-center">
            <User className="w-7 h-7" />
          </div>
          <div>
            <p className="text-slate-400 text-sm font-bold">Punya Tim</p>
            <p className="text-3xl font-black text-white">
              {totalMembers - freeAgents}
            </p>
          </div>
        </div>
        <div className="bg-slate-800/40 border border-slate-700/50 p-6 rounded-3xl flex items-center gap-5">
          <div className="w-14 h-14 bg-orange-500/10 text-orange-500 rounded-2xl flex items-center justify-center">
            <UserMinus className="w-7 h-7" />
          </div>
          <div>
            <p className="text-slate-400 text-sm font-bold">Free Agents</p>
            <p className="text-3xl font-black text-white">{freeAgents}</p>
          </div>
        </div>
      </div>

      {/* DAFTAR MEMBER (GRID CARDS) */}
      <div className="bg-slate-800/40 rounded-3xl p-7 border border-slate-700/50">
        <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-6">
          <Users className="w-5 h-5 text-orange-500" /> Player Roster
        </h3>

        {members.length === 0 ? (
          <p className="text-slate-500 text-center py-10">
            Belum ada data anggota di database.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {members.map((member, index) => (
              <div
                key={member.id}
                className="bg-slate-900/50 border border-slate-700 p-5 rounded-2xl flex items-center justify-between group hover:border-orange-500/30 transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center font-black text-lg text-slate-300">
                    {member.id.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-bold text-slate-200 text-lg flex items-center gap-2">
                      {member.id}
                      {index === 0 && (
                        <Trophy className="w-4 h-4 text-amber-500" />
                      )}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md border uppercase ${member.teamId ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" : "text-slate-400 bg-slate-800 border-slate-700"}`}
                      >
                        {member.teamId || "Free Agent"}
                      </span>
                      <span className="text-[10px] font-bold text-orange-400 bg-orange-500/10 border border-orange-500/20 px-2 py-0.5 rounded-md uppercase">
                        {member.exp || 0} EXP
                      </span>
                    </div>
                  </div>
                </div>

                {/* TOMBOL AKSI ADMIN */}
                <div className="flex items-center gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                  {member.teamId && (
                    <button
                      onClick={() => handleRemoveFromTeam(member.id)}
                      title="Keluarkan dari Tim"
                      className="p-2.5 bg-slate-800 hover:bg-orange-500/20 text-slate-400 hover:text-orange-500 rounded-xl transition-colors"
                    >
                      <UserMinus className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => handleDeleteMember(member.id)}
                    title="Hapus Data Member"
                    className="p-2.5 bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-500 rounded-xl transition-colors"
                  >
                    <UserX className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
