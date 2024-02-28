import { order_by } from '@asteroid-protocol/sdk/client'

export const DEFAULT_LIMIT = 30
export const DEFAULT_PAGE = 1

export function parsePagination(
  urlSearchParams: URLSearchParams,
  defaultLimit = DEFAULT_LIMIT,
) {
  const pageParam = urlSearchParams.get('page')
  const page = pageParam ? parseInt(pageParam) : DEFAULT_PAGE
  const limitParam = urlSearchParams.get('limit')
  const limit = limitParam ? parseInt(limitParam) : defaultLimit
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
  prefix = '',
) {
  let name, directionName: string
  if (prefix) {
    name = `${prefix}_sort`
    directionName = `${prefix}_direction`
  } else {
    name = 'sort'
    directionName = 'direction'
  }

  const sort = urlSearchParams.get(name) ?? defaultSort
  const direction = (urlSearchParams.get(directionName) ??
    defaultDirection) as order_by

  return {
    sort,
    direction,
  }
}
