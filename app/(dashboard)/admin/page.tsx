export default function AdminPage() {
  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold text-white">Daily Quests</h2>
          <p className="text-slate-400 mt-1">
            Atur misi latihan harian dan bagikan EXP ke tim.
          </p>
        </div>
        <button className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg font-medium transition">
          + Buat Misi Baru
        </button>
      </div>

      {/* Kotak Misi Sementara */}
      <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
        <p className="text-slate-400">
          Daftar misi harian (Card Misi) akan muncul di sini.
        </p>
      </div>
    </div>
  );
}
