import { CollectionMetadata } from '@asteroid-protocol/sdk'
import { ValueTypes, order_by } from '@asteroid-protocol/sdk/client'
import { parseSorting } from './pagination'

export function getCollectionsStatsOrder(
  searchParams: URLSearchParams,
  defaultSort: string,
): Array<ValueTypes['collection_stats_order_by']> {
  const { sort, direction } = parseSorting(
    searchParams,
    defaultSort,
    order_by.desc,
  )
  switch (sort) {
    case 'collection':
      return [
        {
          collection: {
            name: direction,
          },
        },
      ]
    case 'collection_id':
      return [
        {
          collection: {
            id: direction,
          },
        },
      ]
    case 'volume_24h':
      return [
        {
          volume_24h: direction,
        },
        {
          volume_7d: direction,
        },
        {
          volume: direction,
        },
      ]
    case 'volume_7d':
      return [
        {
          volume_7d: direction,
        },
        {
          volume: direction,
        },
      ]
    default:
      return [
        {
          [sort]: direction,
        },
      ]
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
