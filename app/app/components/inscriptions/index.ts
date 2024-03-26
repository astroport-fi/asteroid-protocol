export enum Sort {
  LOWEST_PRICE = 'lowest_price',
  HIGHEST_PRICE = 'highest_price',
  RECENTLY_LISTED = 'recently_listed',
  LOWEST_ID = 'lowest_id',
  HIGHEST_ID = 'highest_id',
}

export enum PriceRange {
  ALL = 'all',
  BELOW_0_1 = '0-0.1',
  BETWEEN_0_1_AND_1 = '0.1-1',
  BETWEEN_1_AND_5 = '1-5',
  BETWEEN_5_AND_10 = '5-10',
  BETWEEN_10_AND_100 = '10-100',
  ABOVE_100 = '100-10000',
}

export type Status = 'all' | 'buy'
export const DEFAULT_STATUS: Status = 'all'
export const DEFAULT_SORT_BUY: Sort = Sort.RECENTLY_LISTED
export const DEFAULT_SORT_ALL: Sort = Sort.LOWEST_PRICE
export const DEFAULT_PRICE_RANGE = PriceRange.ALL

export const LIMIT = 30

export function getSort(
  sortParam: string | null,
  status: Status,
  clubParam: string | undefined,
): Sort {
  if (sortParam) {
    return sortParam as Sort
  }

  if (status == 'buy') {
    return DEFAULT_SORT_BUY
  }

  if (clubParam == 'latest') {
    return Sort.HIGHEST_ID
  }

  return DEFAULT_SORT_ALL
}
