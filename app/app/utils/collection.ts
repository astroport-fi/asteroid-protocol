import { ValueTypes, order_by } from '@asteroid-protocol/sdk/client'
import { parseSorting } from './pagination'

export function getCollectionsStatsOrder(
  searchParams: URLSearchParams,
  defaultSort: string,
): ValueTypes['collection_stats_order_by'] {
  const { sort, direction } = parseSorting(
    searchParams,
    defaultSort,
    order_by.desc,
  )
  switch (sort) {
    case 'collection':
      return {
        collection: {
          name: direction,
        },
      }
    case 'collection_id':
      return {
        collection: {
          id: direction,
        },
      }
    default:
      return {
        [sort]: direction,
      }
  }
}
