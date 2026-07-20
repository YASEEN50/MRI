export interface PaginationParams {
  page: number
  limit: number
  skip: number
}

export function parsePagination(
  searchParams: URLSearchParams,
  defaults: { page?: number; limit?: number; maxLimit?: number } = {},
): PaginationParams {
  const defaultPage = defaults.page ?? 1
  const defaultLimit = defaults.limit ?? 20
  const maxLimit = defaults.maxLimit ?? 100

  const rawPage = Number(searchParams.get('page') ?? defaultPage)
  const rawLimit = Number(searchParams.get('limit') ?? defaultLimit)

  const page = Number.isFinite(rawPage) && rawPage >= 1 ? Math.floor(rawPage) : defaultPage
  const limit = Number.isFinite(rawLimit) && rawLimit >= 1
    ? Math.min(Math.floor(rawLimit), maxLimit)
    : defaultLimit

  return { page, limit, skip: (page - 1) * limit }
}
