import { LoaderFunctionArgs } from '@remix-run/cloudflare'
import { Outlet, json, useLoaderData, useParams } from '@remix-run/react'
import { useMemo } from 'react'
import { AsteroidClient } from '~/api/client'
import { getClubBySlug } from '~/api/clubs'
import { CollectionDetail, CollectionTrait } from '~/api/collection'
import { CollectionStats } from '~/api/common'
import { InscriptionWithMarket } from '~/api/inscription'
import ClubDetail from '~/components/ClubDetail'
import CollectionDetailComponent from '~/components/CollectionDetail'
import { Inscriptions } from '~/components/Inscriptions'
import BuyInscriptionDialog from '~/components/dialogs/BuyInscriptionDialog'
import { Filter } from '~/components/inscriptions/InscriptionsFilter'
import LatestInscriptionTxs from '~/components/latest-txs/LatestInscriptionTxs'
import { useDialogWithValue } from '~/hooks/useDialog'
import { getAddress } from '~/utils/cookies'

export async function loader({ context, params, request }: LoaderFunctionArgs) {
  const asteroidClient = new AsteroidClient(context.cloudflare.env.ASTEROID_API)
  const transactions = await asteroidClient.getInscriptionTradeHistory()

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
  let stats: CollectionStats | undefined

  if (params.symbol) {
    collection = await asteroidClient.getCollection(params.symbol)
    if (collection) {
      stats = await asteroidClient.getCollectionStats(collection.id)
    }
  }

  if (params.clubId) {
    const club = getClubBySlug(params.clubId)
    if (club) {
      stats = await asteroidClient.getClubStats(club.range)
    }
  }

  return json({ transactions, reservedListings, collection, stats })
}

export interface Context {
  showDialog: (inscription: InscriptionWithMarket) => void
}

export default function InscriptionsParentPage() {
  const { reservedListings, transactions, collection, stats } =
    useLoaderData<typeof loader>()
  const { dialogRef, value, showDialog } =
    useDialogWithValue<InscriptionWithMarket>()
  const { clubId } = useParams()
  const club = useMemo(
    () => (clubId ? getClubBySlug(clubId) : undefined),
    [clubId],
  )

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-row h-full">
        <Filter traits={collection?.traits as CollectionTrait[]} />
        <div className="flex flex-col w-full h-full">
          {collection && (
            <CollectionDetailComponent collection={collection} stats={stats} />
          )}
          {club && <ClubDetail club={club} stats={stats} />}
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
          <Outlet context={{ showDialog }} />
          <BuyInscriptionDialog inscription={value} ref={dialogRef} />
        </div>
        <LatestInscriptionTxs transactions={transactions} />
      </div>
    </div>
  )
}
