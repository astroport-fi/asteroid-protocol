import { LoaderFunctionArgs, json } from '@remix-run/cloudflare'
import { Link, useLoaderData } from '@remix-run/react'
import { Divider } from 'react-daisyui'
import { AsteroidClient } from '~/api/client'
import GhostEmptyState from '~/components/GhostEmptyState'
import { Inscriptions } from '~/components/Inscriptions'
import { MintReservations } from '~/components/MintReservations'
import { getAddress } from '~/utils/cookies'
import { parsePagination } from '~/utils/pagination'

export async function loader({ context, request, params }: LoaderFunctionArgs) {
  const asteroidClient = new AsteroidClient(context.cloudflare.env.ASTEROID_API)
  const { offset, limit } = parsePagination(
    new URL(request.url).searchParams,
    100,
  )
  let address = params.address
  if (!address) {
    address = await getAddress(request)
  }
  if (!address) {
    return json({
      inscriptions: [],
      pages: 0,
      total: 0,
      listed: [],
      reservations: [],
    })
  }
  const res = await asteroidClient.getUserInscriptions(address, offset, limit, {
    collectionSymbolSearch: 'TROLL:',
  })
  const reservations = await asteroidClient.getUserMintReservations(address, {
    collectionSymbolSearch: 'TROLL:',
  })

  return json({
    inscriptions: res.inscriptions,
    listed: [],
    reservations,
    pages: Math.ceil(res.count / limit),
    total: res.count,
  })
}

export default function PortfolioPage() {
  const data = useLoaderData<typeof loader>()

  const showMintReservations = data.reservations.length > 0
  const showListed = data.listed.length > 0
  const hasUnlisted = data.inscriptions.length > 0
  const showUnlisted = showMintReservations || showListed

  const emptyState = !hasUnlisted && !showMintReservations && !showListed

  if (emptyState) {
    return (
      <GhostEmptyState>
        <div className="flex mt-8">
          <Link to="/" className="btn btn-primary">
            Collect some troll posts
          </Link>
        </div>
      </GhostEmptyState>
    )
  }

  // @todo implement pagination

  return (
    <div className="flex flex-col w-full overflow-y-auto">
      <h2 className="text-center text-xl my-4 lg:mt-0">My portfolio</h2>
      {showMintReservations && (
        <>
          <Divider>Mint Reservations</Divider>
          <MintReservations
            className="w-full"
            reservations={data.reservations}
          />
        </>
      )}
      {showUnlisted && <Divider className="mt-16">Unlisted</Divider>}
      <Inscriptions className="w-full" inscriptions={data.inscriptions} />
    </div>
  )
}
