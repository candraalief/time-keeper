# ⏱ Seminar Timekeeper

Aplikasi timer seminar real-time: kontrol dari HP, tampil di layar proyektor.

**Stack:** Next.js 14 (App Router) · Tailwind CSS · Pusher · Lucide React

---

## Halaman

| URL | Fungsi |
|-----|--------|
| `/` | Landing page |
| `/admin` | Dashboard kontrol (buka di HP) |
| `/display` | Layar timer (buka di laptop projector) |

---

## 🚀 Deploy ke Vercel (5 menit)

### 1. Daftar Pusher (gratis)

1. Buka [https://pusher.com](https://pusher.com) → **Sign Up** (gratis)
2. Buat **New App** baru
3. Pilih cluster **ap1** (Asia Pacific — Singapore) untuk latensi terbaik
4. Salin 4 nilai berikut dari tab **App Keys**:
   - `App ID`
   - `Key`
   - `Secret`
   - `Cluster`

### 2. Push ke GitHub

```bash
git init
git add .
git commit -m "first commit"
git remote add origin https://github.com/username/seminar-timekeeper.git
git push -u origin main
```

### 3. Deploy di Vercel

1. Buka [https://vercel.com](https://vercel.com) → **Add New Project**
2. Import repo GitHub kamu
3. Buka tab **Environment Variables** dan tambahkan:

| Nama | Nilai |
|------|-------|
| `PUSHER_APP_ID` | App ID dari Pusher |
| `PUSHER_SECRET` | Secret dari Pusher |
| `NEXT_PUBLIC_PUSHER_KEY` | Key dari Pusher |
| `NEXT_PUBLIC_PUSHER_CLUSTER` | `ap1` (atau cluster pilihanmu) |

4. Klik **Deploy** ✅

---

## 💻 Menjalankan Lokal

```bash
# 1. Clone repo
git clone https://github.com/username/seminar-timekeeper.git
cd seminar-timekeeper

# 2. Install dependencies
npm install

# 3. Buat file .env.local
cp .env.example .env.local
# Isi nilai Pusher di .env.local

# 4. Jalankan
npm run dev
```

---

## 🎨 Fitur

- **Real-time** — Sinkronisasi instan lewat Pusher WebSocket
- **Auto Color** — Hijau → Kuning (≤2 menit) → Merah (≤30 detik) → Berkedip (habis)
- **Suara Lonceng** — 3-nada chime saat waktu habis
- **Running Text** — Marquee untuk nama pembicara / pengumuman
- **Screen Wake Lock** — Layar proyektor tidak sleep otomatis
- **Fullscreen** — Satu klik masuk mode layar penuh
- **Quick Duration** — Tombol cepat 5m, 10m, 15m, 20m, 30m, 45m, 60m, 90m
- **Responsive** — Admin nyaman di HP, Display optimal di proyektor

---

## ⚙️ Cara Pakai di Hari-H

1. Buka `https://your-app.vercel.app/display` di laptop yang terhubung ke proyektor → fullscreen
2. Buka `https://your-app.vercel.app/admin` di HP Admin
3. Atur durasi → tekan **Mulai**
4. Timer di proyektor akan langsung berjalan ⚡
