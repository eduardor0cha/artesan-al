import { SerwistProvider } from '@serwist/next/react'
import type { Metadata, Viewport } from 'next'

import { messages } from '@/presentation/messages/pt-BR'

import './globals.css'

export const metadata: Metadata = {
  title: {
    default: `${messages.app.name} — ${messages.app.tagline}`,
    template: `%s — ${messages.app.name}`,
  },
  description: messages.app.description,
  applicationName: messages.app.name,
  appleWebApp: {
    capable: true,
    title: messages.app.name,
    statusBarStyle: 'default',
  },
}

export const viewport: Viewport = {
  themeColor: '#1f6f4a',
  // Zooming stays enabled on purpose: pinch-to-zoom is how many people in this audience read.
  maximumScale: 5,
}

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="pt-BR" className="h-full antialiased">
      <body className="flex min-h-full flex-col">
        {/* Registers the service worker built by `serwist build`; off in development so a stale
            cache never masks a code change. */}
        <SerwistProvider swUrl="/sw.js" disable={process.env.NODE_ENV === 'development'}>
          {children}
        </SerwistProvider>
      </body>
    </html>
  )
}
