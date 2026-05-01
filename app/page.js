import Link from 'next/link'
import { LayoutDashboard, Monitor, Clock } from 'lucide-react'

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-6">
      <div className="text-center mb-12">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Clock size={48} className="text-blue-400" />
        </div>
        <h1 className="text-5xl font-black text-white mb-3">
          Seminar Timekeeper
        </h1>
        <p className="text-gray-400 text-lg max-w-md mx-auto">
          Kontrol timer dari HP atau laptop manapun — tampil real-time di proyektor seminar.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 w-full max-w-sm sm:max-w-none sm:w-auto">
        <Link
          href="/admin"
          className="flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white px-10 py-5 rounded-2xl text-xl font-bold transition-all shadow-lg shadow-blue-900/40 hover:scale-105"
        >
          <LayoutDashboard size={24} />
          Dashboard Admin
        </Link>

        <Link
          href="/display"
          className="flex items-center justify-center gap-3 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white px-10 py-5 rounded-2xl text-xl font-bold transition-all shadow-lg shadow-emerald-900/40 hover:scale-105"
        >
          <Monitor size={24} />
          Layar Proyektor
        </Link>
      </div>

      <p className="text-gray-600 text-sm mt-10">
        Buka Admin di HP · Buka Display di laptop yang terhubung ke proyektor
      </p>
    </main>
  )
}
