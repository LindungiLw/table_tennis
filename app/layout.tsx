import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar"; // Mengimpor Sidebar kita

export const metadata: Metadata = {
  title: "PingPong Club Dashboard",
  description: "Sistem Manajemen dan EXP Tim Tenis Meja",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className="flex h-screen overflow-hidden antialiased">
        {/* Sidebar akan selalu diam di kiri */}
        <Sidebar />

        {/* Area Konten Utama di sebelah kanan */}
        <main className="flex-1 overflow-y-auto bg-slate-900">{children}</main>
      </body>
    </html>
  );
}
