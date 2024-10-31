import { ArrowsRightLeftIcon, FunnelIcon } from '@heroicons/react/24/outline'
import { LoaderFunctionArgs } from '@remix-run/cloudflare'
import { Outlet, json, useLoaderData, useParams } from '@remix-run/react'
import { useMemo } from 'react'
import { AsteroidClient } from '~/api/client'
import { ClubStats, getClubBySlug } from '~/api/clubs'
import {
  CollectionDetail,
  CollectionStats,
  CollectionTrait,
} from '~/api/collection'
import { InscriptionWithMarket } from '~/api/inscription'
import ClubDetail from '~/components/ClubDetail'
import CollectionDetailComponent from '~/components/CollectionDetail'
import { Inscriptions } from '~/components/Inscriptions'
import BuyInscriptionDialog from '~/components/dialogs/BuyInscriptionDialog'
import { DEFAULT_STATUS, Status, getSort } from '~/components/inscriptions'
import { Filter } from '~/components/inscriptions/InscriptionsFilter'
import LatestInscriptionTxs from '~/components/latest-txs/LatestInscriptionTxs'
import { useDialogWithValue } from '~/hooks/useDialog'
import { getAddress } from '~/utils/cookies'

export async function loader({ context, params, request }: LoaderFunctionArgs) {
  const { searchParams } = new URL(request.url)
  const status = (searchParams.get('status') as Status | null) ?? DEFAULT_STATUS
  const sort = getSort(searchParams.get('sort'), status, params.clubId)
  const txsType = searchParams.get('txs')

  const asteroidClient = new AsteroidClient(context.cloudflare.env.ASTEROID_API)

  const address = await getAddress(request)
  let reservedListings: InscriptionWithMarket[] | undefined
  if (address) {
    const status = await asteroidClient.getStatus(
      context.cloudflare.env.CHAIN_ID,
    )
    if (status) {
      reservedListings = await asteroidClient.getReservedInscriptions(
        address,
        status.last_processed_height,
        25,
      )
    }
  }

  let collection: CollectionDetail | undefined
  let stats: CollectionStats | ClubStats | undefined

  if (params.symbol) {
    collection = await asteroidClient.getCollection(params.symbol)
    if (collection) {
      stats = await asteroidClient.getCollectionStats(collection.id)
    }
  }

  if (params.clubId) {
    const club = getClubBySlug(params.clubId)
    if (club && club.range) {
      stats = await asteroidClient.getClubStats(club.range)
    }
  }

  const transactions = await asteroidClient.getInscriptionTradeHistory(
    0,
    200,
    txsType === 'collection' && collection != null ? collection.id : undefined,
  )

  const mints = await asteroidClient.getLatestMints()

  return json({
    transactions,
    mints,
    reservedListings,
    collection,
    stats,
    status,
    sort,
  })
}

export interface Context {
  showDialog: (inscription: InscriptionWithMarket) => void
}

export default function InscriptionsParentPage() {
  const {
    reservedListings,
    transactions,
    mints,
    collection,
    stats,
    status,
    sort,
  } = useLoaderData<typeof loader>()
  const { dialogRef, value, showDialog } =
    useDialogWithValue<InscriptionWithMarket>()
  const { clubId } = useParams()
  const club = useMemo(
    () => (clubId ? getClubBySlug(clubId) : undefined),
    [clubId],
  )

  return (
    <div className="flex flex-col h-full">
      <div className="drawer lg:drawer-open flex flex-row h-full">
        <input id="filter-drawer" type="checkbox" className="drawer-toggle" />

        <div className="drawer-side z-50 shrink-0 h-full">
          <label
            htmlFor="filter-drawer"
            aria-label="close sidebar"
            className="drawer-overlay"
          ></label>
          <Filter
            traits={collection?.traits as CollectionTrait[]}
            sort={sort}
            status={status}
            showRaritySort={collection != null}
          />
        </div>
        <div className="drawer-content flex flex-row w-full">
          <div className="flex flex-col w-full h-full">
            {reservedListings && reservedListings.length > 0 && (
              <div className="flex flex-col px-8 mt-8">
                <h3 className="text-lg">Reserved by you</h3>
                <Inscriptions
                  className="mt-4"
                  inscriptions={reservedListings}
                  onClick={(inscription) => {
                    showDialog(inscription)
                  }}
                />
                <h3 className="text-lg mt-16">All listings</h3>
              </div>
            )}

            <div id="scrollableDiv" className="overflow-y-scroll h-full">
              {collection && (
                <CollectionDetailComponent
                  collection={collection}
                  stats={stats}
                />
              )}
              {club && <ClubDetail club={club} stats={stats} />}

              <div className="flex justify-between sticky top-0 bg-base-300 z-40">
                <label
                  htmlFor="filter-drawer"
                  className="drawer-button flex items-center lg:hidden mx-8 my-2"
                >
                  <FunnelIcon className="size-5" />
                  <span className="ml-2">Filter</span>
                </label>
                <label
                  htmlFor="transactions-drawer"
                  className="drawer-button flex items-center lg:hidden mx-8 my-2"
                >
                  <ArrowsRightLeftIcon className="size-5" />
                  <span className="ml-2">Latest transactions</span>
                </label>
              </div>
              <Outlet context={{ showDialog }} />
            </div>
            <BuyInscriptionDialog inscription={value} ref={dialogRef} />
          </div>
          <div className="drawer drawer-end lg:drawer-open w-min h-full">
            <input
              id="transactions-drawer"
              type="checkbox"
              className="drawer-toggle"
            />
            <div className="drawer-content">{/* Page content here */}</div>
            <div className="drawer-side z-50 shrink-0 h-full">
              <label
                htmlFor="transactions-drawer"
                aria-label="close sidebar"
                className="drawer-overlay"
              ></label>
              <LatestInscriptionTxs
                mints={mints}
                transactions={transactions}
                collectionName={collection?.name}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
