import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
  
  const routes: Array<{
    route: string
    priority: number
    changeFrequency: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never'
  }> = [
    {
      route: '',
      priority: 1.0,
      changeFrequency: 'weekly',
    },
    {
      route: '/continent-distribution',
      priority: 0.9,
      changeFrequency: 'monthly',
    },
    {
      route: '/asian-trends',
      priority: 0.9,
      changeFrequency: 'monthly',
    },
    {
      route: '/big-tech-analysis',
      priority: 0.9,
      changeFrequency: 'monthly',
    },
    {
      route: '/committee-analysis',
      priority: 0.9,
      changeFrequency: 'monthly',
    },
    {
      route: '/diversity',
      priority: 0.9,
      changeFrequency: 'monthly',
    },
    {
      route: '/about',
      priority: 0.7,
      changeFrequency: 'monthly',
    },
  ]

  return routes.map(({ route, priority, changeFrequency }) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency,
    priority,
    alternates: {
      languages: {
        en: `${baseUrl}${route}`,
      },
    },
  }))
}


