import { getLocale } from 'next-intl/server'
import HomePublicationsFeed from '@/components/home/HomePublicationsFeed'
import { getHomePublications } from '@/lib/home/get-home-publications'

export default async function HomePublicationsSection() {
  const locale = await getLocale() as 'ar' | 'en'

  let publications: Awaited<ReturnType<typeof getHomePublications>> = []
  try {
    publications = await getHomePublications(8)
  } catch {
    publications = []
  }

  return <HomePublicationsFeed publications={publications} locale={locale} />
}
