import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

// Menggunakan font Inter bawaan Next.js agar rapi
const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "PINGPONG | Club JIU",
  description: "Portal Manajemen Tim Tenis Meja JIU",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      {/* flex & h-screen: Membuat layout memenuhi layar dan bersebelahan (kiri-kanan)
        overflow-hidden: Mencegah layar utama bergeser/scroll secara keseluruhan
      */}
      <body
        className={`${inter.className} bg-slate-950 text-white antialiased flex h-screen overflow-hidden`}
      >
        {/* Sidebar dipanggil di sini. 
          Tenang saja, dia otomatis hilang di halaman Login karena logika di dalamnya.
        */}
        <Sidebar />

        {/* Area Konten Utama (Dashboard Admin/Member akan muncul di dalam sini)
          flex-1: Mengambil sisa ruang di sebelah kanan Sidebar
          overflow-y-auto: Membiarkan konten di sebelah kanan bisa di-scroll ke bawah
          pt-20 md:pt-0: (BARU) Memberi jarak atas di HP agar tidak tertabrak tombol menu
        */}
        <main className="flex-1 h-full overflow-y-auto relative pt-20 md:pt-0">
          {children}
        </main>
      </body>
    </html>
  );
}
