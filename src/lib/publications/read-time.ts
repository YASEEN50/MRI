import { publicationExcerpt } from '@/lib/publications/excerpt'

/** Estimated reading time in minutes from publication text. */
export function estimateReadTimeMinutes(
  summary: string | null | undefined,
  content: string | null | undefined,
  locale: 'ar' | 'en' = 'ar',
): number {
  const source = publicationExcerpt(summary, content, 50_000)
  const words = source.split(/\s+/).filter(Boolean).length
  const wordsPerMinute = locale === 'ar' ? 180 : 220
  return Math.max(1, Math.ceil(words / wordsPerMinute))
}

export function formatReadTime(minutes: number, locale: 'ar' | 'en'): string {
  if (locale === 'ar') return `${minutes} د قراءة`
  return `${minutes} min read`
}
