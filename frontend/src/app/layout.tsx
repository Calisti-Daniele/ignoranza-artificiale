import type { Metadata } from 'next'
import { Bricolage_Grotesque, DM_Sans, JetBrains_Mono, Playfair_Display } from 'next/font/google'
import { headers } from 'next/headers'
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

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // The nonce is injected by src/middleware.ts on every request and forwarded
  // via the x-nonce response header so server components can read it here.
  // Pass it as the `nonce` prop on any <Script> or inline <script> tags to
  // satisfy the nonce-based Content-Security-Policy.
  const nonce = (await headers()).get('x-nonce') ?? undefined

  return (
    <html
      lang="it"
      className={`${bricolage.variable} ${dmSans.variable} ${jetbrainsMono.variable} ${playfairDisplay.variable}`}
    >
      <head>
        {/* Expose the nonce via a meta tag so client utilities can read it when needed */}
        {nonce && <meta name="csp-nonce" content={nonce} />}
        {/* Viewport meta: prevents iOS auto-zoom on input focus */}
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </head>
      <body className="font-body bg-background text-text-primary antialiased" suppressHydrationWarning>{children}</body>
    </html>
  )
}
