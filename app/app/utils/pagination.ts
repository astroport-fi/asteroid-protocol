import { order_by } from '@asteroid-protocol/sdk'

export const DEFAULT_LIMIT = 30
export const DEFAULT_PAGE = 1

export function parsePagination(urlSearchParams: URLSearchParams) {
  const pageParam = urlSearchParams.get('page')
  const page = pageParam ? parseInt(pageParam) : DEFAULT_PAGE
  const limitParam = urlSearchParams.get('limit')
  const limit = limitParam ? parseInt(limitParam) : DEFAULT_LIMIT
  const offset = (page - 1) * limit

  return {
    page,
    offset,
    limit,
  }
}

export function parseSorting(
  urlSearchParams: URLSearchParams,
  defaultSort: string,
  defaultDirection: order_by,
) {
  const sort = urlSearchParams.get('sort') ?? defaultSort
  const direction = (urlSearchParams.get('direction') ??
    defaultDirection) as order_by

  return {
    sort,
    direction,
  }
}
