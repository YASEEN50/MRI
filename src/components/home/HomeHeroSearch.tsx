'use client'
// src/components/home/HomeHeroSearch.tsx

import SearchBar from '@/components/common/SearchBar'

export default function HomeHeroSearch() {
  return (
    <div className="w-full animate-slide-up">
      <SearchBar variant="hero" />
    </div>
  )
}
