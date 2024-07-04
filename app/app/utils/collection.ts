import { CollectionMetadata } from '@asteroid-protocol/sdk'
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

export function usesAsteroidSocialLinks(
  symbol: string,
  metadata: CollectionMetadata,
) {
  if (symbol === 'BRIDGORS') {
    return false
  }

  if (
    metadata.telegram &&
    metadata.telegram.toLowerCase().includes('https://t.me/asteroidxyz')
  ) {
    return true
  }

  if (
    metadata.twitter &&
    metadata.twitter.toLowerCase().includes('https://twitter.com/asteroidxyz')
  ) {
    return true
  }

  if (metadata.website) {
    try {
      let urlString = metadata.website
      if (!/^(ht)tps?:\/\//i.test(metadata.website)) {
        urlString = `https://${urlString}`
      }

      const url = new URL(urlString)
      if (
        (url.hostname.includes('asteroidprotocol.io') &&
          url.pathname === '/') ||
        url.pathname === '/app/inscriptions'
      ) {
        return true
      }
    } catch (err) {
      return false
    }
  }

  return false
}
