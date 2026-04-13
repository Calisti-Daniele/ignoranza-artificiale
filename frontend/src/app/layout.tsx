import type { Metadata } from 'next'
import { Bricolage_Grotesque, DM_Sans, JetBrains_Mono, Playfair_Display } from 'next/font/google'
import './globals.css'

const bricolage = Bricolage_Grotesque({
  subsets: ['latin'],
  variable: '--font-bricolage',
  display: 'swap',
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains',
  display: 'swap',
})

const playfairDisplay = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Ignoranza Artificiale™',
  description: 'Il sistema è operativo. Siamo spiacenti.',
  openGraph: {
    title: 'Ignoranza Artificiale™',
    description: 'Il sistema è operativo. Siamo spiacenti.',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="it"
      className={`${bricolage.variable} ${dmSans.variable} ${jetbrainsMono.variable} ${playfairDisplay.variable}`}
    >
      <body className="font-body bg-background text-text-primary antialiased">{children}</body>
    </html>
  )
}
