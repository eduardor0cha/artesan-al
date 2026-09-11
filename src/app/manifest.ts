import type { MetadataRoute } from 'next'

import { messages } from '@/presentation/messages/pt-BR'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${messages.app.name} — ${messages.app.tagline}`,
    short_name: messages.app.name,
    description: messages.app.description,
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#1f6f4a',
    lang: 'pt-BR',
    categories: ['shopping', 'travel', 'lifestyle'],
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  }
}
