import Link from 'next/link'
import QRCode from 'qrcode'
import { LayoutDashboard, Monitor, QrCode, Radio, Timer, Wifi } from 'lucide-react'

function getBaseUrl() {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  return 'http://localhost:3000'
}

export default async function Home() {
  const displayUrl = `${getBaseUrl()}/display`
  const qrCode = await QRCode.toDataURL(displayUrl, {
    margin: 1,
    width: 220,
    color: {
      dark: '#09090b',
      light: '#ffffff',
    },
  })

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <section className="mx-auto grid min-h-screen max-w-6xl items-center gap-10 px-5 py-10 lg:grid-cols-[1fr_360px]">
        <div>
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-sky-400/30 bg-sky-400/10 px-3 py-1 text-sm font-bold text-sky-200">
            <Radio size={16} />
            Broadcast-ready seminar timer
          </div>

          <h1 className="max-w-3xl text-5xl font-black leading-none tracking-normal text-white md:text-7xl">
            Seminar Timekeeper
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-zinc-400">
            Kontrol timer, agenda, tema display, dan running text dari satu panel operator.
            Display projector tetap sinkron lewat Pusher dan restore state lewat Supabase.
          </p>

          <div className="mt-8 grid max-w-xl gap-3 sm:grid-cols-2">
            <Link
              href="/admin"
              className="inline-flex min-h-14 items-center justify-center gap-3 rounded-lg bg-sky-600 px-5 text-base font-black text-white transition hover:bg-sky-500"
            >
              <LayoutDashboard size={21} />
              Buka Admin Panel
            </Link>
            <Link
              href="/display"
              className="inline-flex min-h-14 items-center justify-center gap-3 rounded-lg bg-emerald-600 px-5 text-base font-black text-white transition hover:bg-emerald-500"
            >
              <Monitor size={21} />
              Buka Display
            </Link>
          </div>

          <div className="mt-10 grid max-w-3xl gap-3 md:grid-cols-3">
            {[
              ['1', 'Buka Display', 'Pasang laptop ke projector lalu buka halaman display.'],
              ['2', 'Buka Admin', 'Operator membuka admin panel dari HP atau laptop.'],
              ['3', 'TAKE Program', 'Load sesi ke preview, lalu TAKE untuk tampil live.'],
            ].map(([number, title, body]) => (
              <div key={number} className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
                <div className="mb-3 flex h-8 w-8 items-center justify-center rounded bg-sky-500 text-sm font-black text-white">
                  {number}
                </div>
                <h2 className="font-black text-white">{title}</h2>
                <p className="mt-1 text-sm leading-6 text-zinc-400">{body}</p>
              </div>
            ))}
          </div>
        </div>

        <aside className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
          <div className="mb-4 flex items-center gap-2">
            <QrCode size={20} className="text-sky-300" />
            <h2 className="font-black">Scan Display URL</h2>
          </div>
          <div className="rounded-lg bg-white p-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrCode} alt="QR code to open display page" className="h-auto w-full" />
          </div>
          <p className="mt-3 break-all text-xs leading-5 text-zinc-500">{displayUrl}</p>

          <div className="mt-5 grid gap-2 text-sm text-zinc-300">
            <div className="flex items-center gap-2">
              <Timer size={16} className="text-emerald-300" />
              Timestamp-based sync
            </div>
            <div className="flex items-center gap-2">
              <Wifi size={16} className="text-emerald-300" />
              Pusher realtime events
            </div>
          </div>
        </aside>
      </section>
    </main>
  )
}
