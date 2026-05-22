import { Bebas_Neue, Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })
const bebas = Bebas_Neue({ subsets: ['latin'], weight: '400', variable: '--font-display' })

export const metadata = {
  title: 'Seminar Timekeeper',
  description: 'Real-time seminar timer — kontrol dari HP, tampil di proyektor',
}

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body className={`${inter.className} ${bebas.variable} bg-gray-950 text-white`}>
        {children}
      </body>
    </html>
  )
}
