import { LoaderFunctionArgs, json } from '@remix-run/cloudflare'
import { Link, useLoaderData } from '@remix-run/react'
import { Divider } from 'react-daisyui'
import { AsteroidClient } from '~/api/client'
import GhostEmptyState from '~/components/GhostEmptyState'
import { Inscriptions } from '~/components/Inscriptions'
import { MintReservations } from '~/components/MintReservations'
import Pagination from '~/components/Pagination'
import usePagination from '~/hooks/usePagination'
import { getAddress } from '~/utils/cookies'
import { parsePagination } from '~/utils/pagination'

export async function loader({ context, request, params }: LoaderFunctionArgs) {
  const asteroidClient = new AsteroidClient(context.cloudflare.env.ASTEROID_API)
  const { offset, limit } = parsePagination(new URL(request.url).searchParams)
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
  const listedRes = await asteroidClient.getUserListedInscriptions(
    address,
    0,
    500,
    {
      collectionSymbolSearch: 'TROLL:',
    },
  )
  const reservations = await asteroidClient.getUserMintReservations(address, {
    collectionSymbolSearch: 'TROLL:',
  })

  return json({
    inscriptions: res.inscriptions,
    listed: listedRes.inscriptions,
    reservations,
    pages: Math.ceil(res.count / limit),
    total: res.count,
  })
}

export default function WalletInscriptions() {
  const data = useLoaderData<typeof loader>()
  const [pagination, setPagination] = usePagination()

  const showMintReservations = data.reservations.length > 0
  const showListed = data.listed.length > 0
  const hasUnlisted = data.inscriptions.length > 0
  const showUnlisted = showMintReservations || showListed

  const emptyState = !hasUnlisted && !showMintReservations && !showListed

  if (emptyState) {
    return (
      <GhostEmptyState>
        <div className="flex mt-8">
          <Link to="/app/create/inscription" className="btn btn-primary">
            Create inscription
          </Link>
          <Link to="/app/inscriptions" className="btn btn-primary ml-4">
            Buy inscriptions
          </Link>
        </div>
      </GhostEmptyState>
    )
  }
  return (
    <div className="flex flex-col w-full overflow-y-scroll">
      {showMintReservations && (
        <>
          <Divider>Mint Reservations</Divider>
          <MintReservations
            className="w-full"
            reservations={data.reservations}
          />
        </>
      )}
      {showListed && (
        <>
          <Divider>Listed</Divider>
          <Inscriptions className="w-full" inscriptions={data.listed} />
        </>
      )}
      {showUnlisted && <Divider className="mt-16">Unlisted</Divider>}
      <Inscriptions className="w-full" inscriptions={data.inscriptions} />
      <Pagination
        pageCount={data.pages}
        pagination={pagination}
        total={data.total}
        setPagination={setPagination}
        className="mt-8"
      />
    </div>
  )
}
