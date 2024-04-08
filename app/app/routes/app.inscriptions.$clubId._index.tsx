import { ValueTypes, order_by } from '@asteroid-protocol/sdk/client'
import { LoaderFunctionArgs, defer } from '@remix-run/cloudflare'
import { Await, useLoaderData, useOutletContext } from '@remix-run/react'
import { Suspense } from 'react'
import { Loading } from 'react-daisyui'
import { AsteroidClient, TraitItem } from '~/api/client'
import { getClubBySlug } from '~/api/clubs'
import { CollectionDetail } from '~/api/collection'
import {
  DEFAULT_STATUS,
  LIMIT,
  Sort,
  Status,
  getSort,
} from '~/components/inscriptions'
import InscriptionsList from '~/components/inscriptions/InscriptionsList'
import { parsePagination } from '~/utils/pagination'
import { Context } from './app.inscriptions.$clubId'

export async function loader({ context, request, params }: LoaderFunctionArgs) {
  const { searchParams } = new URL(request.url)
  const status = (searchParams.get('status') as Status | null) ?? DEFAULT_STATUS
  const from = searchParams.get('from')
  const to = searchParams.get('to')
  const sort = getSort(searchParams.get('sort'), status, params.clubId)
  const search = searchParams.get('search') ?? ''

  let orderBy: ValueTypes['inscription_market_order_by'] | undefined
  switch (sort) {
    case Sort.LOWEST_PRICE:
      orderBy = {
        inscription: {
          id: order_by.desc,
        },
        marketplace_listing: {
          total: order_by.asc,
        },
      }
      break
    case Sort.HIGHEST_PRICE:
      orderBy = {
        inscription: {
          id: order_by.desc,
        },
        marketplace_listing: {
          total: order_by.desc_nulls_last,
        },
      }
      break
    case Sort.RECENTLY_LISTED:
      orderBy = {
        marketplace_inscription_detail: {
          id: order_by.desc_nulls_last,
        },
        inscription: {
          id: order_by.desc,
        },
      }
      break
    case Sort.LOWEST_ID:
      orderBy = {
        inscription: {
          id: order_by.asc,
        },
      }
      break
    case Sort.HIGHEST_ID:
      orderBy = {
        inscription: {
          id: order_by.desc,
        },
      }
      break
    case Sort.COMMON:
      orderBy = {
        inscription: {
          rarity: {
            rarity_rank: order_by.desc,
          },
        },
      }
      break
    case Sort.RARE:
      orderBy = {
        inscription: {
          rarity: {
            rarity_rank: order_by.asc,
          },
        },
      }
  }

  const asteroidClient = new AsteroidClient(context.cloudflare.env.ASTEROID_API)

  let collection: CollectionDetail | undefined
  let traitsFilter: TraitItem[][] | undefined

  if (params.symbol) {
    collection = await asteroidClient.getCollection(params.symbol)
    if (collection) {
      const traits = collection?.traits.reduce((acc, trait) => {
        acc.add(trait.trait_type!)
        return acc
      }, new Set<string>())

      traitsFilter = []
      for (const trait of traits) {
        if (searchParams.has(trait)) {
          const traitParam = searchParams.get(trait)!
          const traitFilter = []
          for (const value of traitParam.split(',')) {
            traitFilter.push({
              trait_type: trait,
              value,
            })
          }
          traitsFilter.push(traitFilter)
        }
      }
    }
  }

  let inscriptionNumberLTE: number | undefined
  if (params.clubId) {
    const club = getClubBySlug(params.clubId)
    if (club && club.range) {
      inscriptionNumberLTE = club.range
    }
  }

  const { offset, limit, page } = parsePagination(searchParams, LIMIT)
  const result = asteroidClient.getInscriptions(
    offset,
    limit,
    {
      onlyBuy: status == 'buy',
      inscriptionNumberLTE,
      priceGTE: from ? parseFloat(from) * 10e5 : undefined,
      priceLTE: to ? parseFloat(to) * 10e5 : undefined,
      search,
      collectionId: collection?.id,
      traitFilters: traitsFilter,
    },
    orderBy,
  )

  return defer({
    data: result,
    page,
  })
}

export default function InscriptionsPage() {
  const data = useLoaderData<typeof loader>()
  const { showDialog } = useOutletContext<Context>()

  return (
    <>
      <Suspense
        fallback={
          <div className="flex items-start justify-center w-full">
            <Loading variant="dots" size="lg" />
          </div>
        }
      >
        <Await resolve={data.data}>
          {(inscriptionsData) => (
            <>
              <InscriptionsList
                page={data.page}
                inscriptions={inscriptionsData.inscriptions}
                count={inscriptionsData.count}
                onClick={(inscription) => {
                  showDialog(inscription)
                }}
              />
            </>
          )}
        </Await>
      </Suspense>
    </>
  )
}
