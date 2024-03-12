import { ValueTypes, order_by } from '@asteroid-protocol/sdk/client'
import { LoaderFunctionArgs, defer, json } from '@remix-run/cloudflare'
import { Await, useLoaderData } from '@remix-run/react'
import clsx from 'clsx'
import { Suspense, useState } from 'react'
import { Loading } from 'react-daisyui'
import { AsteroidClient, TraitFilterItem } from '~/api/client'
import { CollectionDetail, CollectionTrait } from '~/api/collection'
import {
  InscriptionTradeHistory,
  InscriptionWithMarket,
} from '~/api/inscription'
import CollectionDetailComponent from '~/components/CollectionDetail'
import { Inscriptions } from '~/components/Inscriptions'
import BuyInscriptionDialog from '~/components/dialogs/BuyInscriptionDialog'
import {
  DEFAULT_RANGE,
  DEFAULT_STATUS,
  LIMIT,
  Range,
  Sort,
  Status,
  getDefaultSort,
} from '~/components/inscriptions'
import { Filter } from '~/components/inscriptions/InscriptionsFilter'
import InscriptionsList from '~/components/inscriptions/InscriptionsList'
import LatestInscriptionTxs from '~/components/latest-txs/LatestInscriptionTxs'
import useDialog from '~/hooks/useDialog'
import { getAddress } from '~/utils/cookies'
import { parsePagination } from '~/utils/pagination'

export async function loader({ context, request, params }: LoaderFunctionArgs) {
  const searchParams = new URL(request.url).searchParams
  const status = searchParams.get('status') ?? DEFAULT_STATUS
  const range = searchParams.get('range') ?? DEFAULT_RANGE
  const from = searchParams.get('from')
  const to = searchParams.get('to')
  const sort = searchParams.get('sort') ?? getDefaultSort(status as Status)
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
  }

  const asteroidClient = new AsteroidClient(context.cloudflare.env.ASTEROID_API)

  let collection: CollectionDetail | undefined
  let traitsFilter: TraitFilterItem[][] | undefined

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

  const { offset, limit, page } = parsePagination(searchParams, LIMIT)
  const result = asteroidClient.getInscriptions(
    offset,
    limit,
    {
      onlyBuy: status == 'buy',
      idLTE: range != Range.ALL ? parseInt(range) : undefined,
      priceGTE: from ? parseFloat(from) * 10e5 : undefined,
      priceLTE: to ? parseFloat(to) * 10e5 : undefined,
      search,
      collectionId: collection?.id,
      traitFilters: traitsFilter,
    },
    orderBy,
  )

  if (page > 1) {
    const awaitedResult = await result
    return json({
      collection, // @todo
      data: awaitedResult,
      page,
      transactions: [] as InscriptionTradeHistory[],
      reservedListings: [] as InscriptionWithMarket[],
    })
  }

  const transactions = asteroidClient.getInscriptionTradeHistory()

  const address = await getAddress(request)
  let reservedListings: Promise<InscriptionWithMarket[]> | undefined
  if (address) {
    const status = await asteroidClient.getStatus(
      context.cloudflare.env.CHAIN_ID,
    )
    if (status) {
      reservedListings = asteroidClient.getReservedInscriptions(
        address,
        status.last_processed_height,
        25,
      )
    }
  }

  return defer({
    data: result,
    collection,
    page,
    reservedListings,
    transactions,
  })
}

export default function InscriptionsPage() {
  const data = useLoaderData<typeof loader>()
  const [inscription, setInscription] = useState<InscriptionWithMarket | null>(
    null,
  )
  const { dialogRef, handleShow } = useDialog()

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-row h-full">
        <Filter
          traits={data.collection?.traits as CollectionTrait[] | undefined}
        />
        <div className="flex flex-col w-full h-full">
          <Suspense>
            <Await resolve={data.reservedListings}>
              {(reservedListing) =>
                reservedListing &&
                reservedListing.length > 0 && (
                  <div className="flex flex-col px-8 mt-8">
                    <h3 className="text-lg">Reserved by you</h3>
                    <Inscriptions
                      className="mt-4"
                      inscriptions={reservedListing}
                      onClick={(inscription) => {
                        setInscription(inscription)
                        handleShow()
                      }}
                    />
                    <h3 className="text-lg mt-16">All listings</h3>
                  </div>
                )
              }
            </Await>
          </Suspense>
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
                  {data.collection && (
                    <CollectionDetailComponent collection={data.collection} />
                  )}
                  <InscriptionsList
                    page={data.page}
                    inscriptions={inscriptionsData.inscriptions}
                    count={inscriptionsData.count}
                    onClick={(inscription) => {
                      setInscription(inscription)
                      handleShow()
                    }}
                  />
                </>
              )}
            </Await>
          </Suspense>
          <BuyInscriptionDialog inscription={inscription!} ref={dialogRef} />
        </div>
        <Suspense fallback={<LatestInscriptionTxs transactions={[]} />}>
          <Await resolve={data.transactions}>
            {(transactions) => (
              <LatestInscriptionTxs transactions={transactions!} />
            )}
          </Await>
        </Suspense>
      </div>
    </div>
  )
}
