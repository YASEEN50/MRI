import { getLocale } from 'next-intl/server'
import HomeAdsSidebar from '@/components/home/HomeAdsSidebar'
import { getActiveHomeSidebarAds } from '@/lib/home/get-home-ads'

export default async function HomeAdsSection() {
  const locale = await getLocale() as 'ar' | 'en'

  let ads: Awaited<ReturnType<typeof getActiveHomeSidebarAds>> = []
  try {
    ads = await getActiveHomeSidebarAds(4)
  } catch {
    ads = []
  }

  return <HomeAdsSidebar ads={ads} locale={locale} variant="section" />
}
