import type { Metadata } from 'next'
import { Providers } from '@/components/Providers'
import './globals.css'

export const metadata: Metadata = {
  title: 'BaseAmp — Base Network Dashboard',
  description: 'Grow your Farcaster followers & stack Base TXs — daily GM streak',
  openGraph: {
    title: 'BaseAmp',
    description: 'Base Network Dashboard — Earn, Deploy, GM',
    images: ['/og.png'],
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
