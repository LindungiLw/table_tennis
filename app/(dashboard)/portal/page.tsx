export default function PortalPage() {
  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold text-white">Team Portal Access</h2>
          <p className="text-slate-400 mt-1">
            Atur akses login untuk anggota tim tenis meja.
          </p>
        </div>
      </div>

      {/* Kotak Pengaturan Sementara */}
      <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
        <h3 className="text-xl font-semibold text-white mb-4">
          Pengaturan Akses Login
        </h3>
        <p className="text-slate-400">
          Nanti di sini kita buatkan tombol sakelar (Toggle ON/OFF) dan
          pengaturan jadwal (Schedule Window) yang kita bahas sebelumnya.
        </p>
      </div>
    </div>
  );
}
