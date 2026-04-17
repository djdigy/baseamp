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

// Runs before paint to prevent flash
const themeScript = `(function(){try{var t=localStorage.getItem('ba_theme');if(t==='light')document.documentElement.classList.add('light')}catch(e){}})()`

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
