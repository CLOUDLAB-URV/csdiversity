import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
  
  return {
    name: 'CSdiversity',
    short_name: 'CSdiversity',
    description: 'Visualize and analyze academic conference data from top-tier systems and networks conferences',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#1f3b6f',
    orientation: 'portrait-primary',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
    categories: ['education', 'research', 'data-visualization'],
    lang: 'en-US',
    dir: 'ltr',
    scope: '/',
  }
}

