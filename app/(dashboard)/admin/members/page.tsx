"use client";

import { useState, useEffect } from "react";
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  arrayRemove, // <-- TAMBAHAN BARU
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
  Crown,
  Swords,
} from "lucide-react";

export default function AdminMembersPage() {
  const [members, setMembers] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  const router = useRouter();
  const ADMIN_EMAIL = "rahmalindungilaowo380@gmail.com";

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

  useEffect(() => {
    if (!db || isAuthChecking) return;

    const unsubMembers = onSnapshot(collection(db, "users"), (snapshot) => {
      const membersData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setMembers(
        membersData.sort((a: any, b: any) => (b.exp || 0) - (a.exp || 0)),
      );
    });

    const unsubTeams = onSnapshot(collection(db, "teams"), (snapshot) => {
      const teamsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setTeams(teamsData.sort((a: any, b: any) => (b.exp || 0) - (a.exp || 0)));
    });

    return () => {
      unsubMembers();
      unsubTeams();
    };
  }, [isAuthChecking]);

  // --- LOGIKA KELUARKAN DARI TIM (SINKRONISASI SEMPURNA) ---
  const handleRemoveFromTeam = async (userId: string, teamId: string) => {
    if (confirm(`Keluarkan ${userId} dari timnya saat ini?`)) {
      try {
        // 1. Hapus status tim di profil user
        await updateDoc(doc(db, "users", userId), { teamId: null });

        // 2. Hapus nama user dari array tim (kalau timnya ada)
        if (teamId) {
          await updateDoc(doc(db, "teams", teamId), {
            members: arrayRemove(userId),
          });
        }

        alert(`${userId} sekarang menjadi Free Agent.`);
      } catch (error) {
        console.error(error);
        alert("Gagal mengeluarkan member dari tim.");
      }
    }
  };

  // --- LOGIKA HAPUS MEMBER (SINKRONISASI SEMPURNA) ---
  const handleDeleteMember = async (userId: string, teamId: string | null) => {
    if (
      confirm(
        `HAPUS PERMANEN data ${userId}? Tindakan ini tidak bisa dibatalkan.`,
      )
    ) {
      try {
        // 1. Jika dia punya tim, bersihkan dulu namanya dari tim tersebut
        if (teamId) {
          await updateDoc(doc(db, "teams", teamId), {
            members: arrayRemove(userId),
          });
        }

        // 2. Baru hapus akun usernya
        await deleteDoc(doc(db, "users", userId));

        alert(`Data ${userId} berhasil dihapus dari database.`);
      } catch (error) {
        console.error(error);
        alert("Gagal menghapus data member.");
      }
    }
  };

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
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            Data Anggota & Tim <ShieldAlert className="w-6 h-6 text-rose-500" />
          </h2>
          <p className="text-slate-400 mt-2">
            Pantau dan kelola seluruh roster dan performa tim Pingpong Club JIU.
          </p>
        </div>
      </section>

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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-slate-800/40 rounded-3xl p-7 border border-slate-700/50">
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

                  <div className="flex items-center gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                    {member.teamId && (
                      <button
                        onClick={() =>
                          handleRemoveFromTeam(member.id, member.teamId)
                        } // <-- Diubah
                        title="Keluarkan dari Tim"
                        className="p-2.5 bg-slate-800 hover:bg-orange-500/20 text-slate-400 hover:text-orange-500 rounded-xl transition-colors"
                      >
                        <UserMinus className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() =>
                        handleDeleteMember(member.id, member.teamId || null)
                      } // <-- Diubah
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

        <div className="bg-slate-800/40 rounded-3xl p-7 border border-slate-700/50 h-fit">
          <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-6">
            <Swords className="w-5 h-5 text-amber-500" /> Top Tim Duo
          </h3>

          {teams.length === 0 ? (
            <p className="text-slate-500 text-center text-sm py-10">
              Belum ada tim duo yang terbentuk.
            </p>
          ) : (
            <div className="space-y-4">
              {teams.map((team, idx) => (
                <div
                  key={team.id}
                  className="bg-slate-900/50 border border-slate-700 p-4 rounded-2xl flex items-center justify-between transition-all hover:border-amber-500/30"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shadow-inner ${idx === 0 ? "bg-amber-500 text-slate-900 shadow-amber-500/20" : idx === 1 ? "bg-slate-300 text-slate-800" : idx === 2 ? "bg-amber-700/50 text-amber-200" : "bg-slate-800 text-slate-400"}`}
                    >
                      {idx === 0 ? <Crown className="w-5 h-5" /> : idx + 1}
                    </div>
                    <div>
                      <p
                        className={`font-bold text-sm ${idx === 0 ? "text-white" : "text-slate-300"}`}
                      >
                        {team.name}
                      </p>
                      <p className="text-[10px] text-slate-500 mt-0.5 truncate max-w-[120px]">
                        {team.members?.join(" & ") || "Kosong"}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p
                      className={`font-black ${idx === 0 ? "text-amber-500 text-lg" : "text-slate-400 text-base"}`}
                    >
                      {team.exp || 0}
                    </p>
                    <p className="text-[9px] text-slate-500 uppercase font-bold -mt-1">
                      EXP
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
