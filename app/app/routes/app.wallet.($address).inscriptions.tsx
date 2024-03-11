import { LoaderFunctionArgs, json } from '@remix-run/cloudflare'
import { Link, useLoaderData } from '@remix-run/react'
import { Divider } from 'react-daisyui'
import { AsteroidClient } from '~/api/client'
import GhostEmptyState from '~/components/GhostEmptyState'
import { Inscriptions } from '~/components/Inscriptions'
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
    return json({ inscriptions: [], pages: 0, listed: [] })
  }
  const res = await asteroidClient.getUserInscriptions(address, offset, limit)
  const listedRes = await asteroidClient.getUserListedInscriptions(
    address,
    0,
    500,
  )

  return json({
    inscriptions: res.inscriptions,
    listed: listedRes.inscriptions,
    pages: Math.ceil(res.count / limit),
  })
}

export default function WalletInscriptions() {
  const data = useLoaderData<typeof loader>()
  const [pagination, setPagination] = usePagination()

  if (data.inscriptions.length < 1) {
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
    <div>
      {data.listed.length > 0 && (
        <>
          <Divider>Listed</Divider>
          <Inscriptions className="w-full" inscriptions={data.listed} />
          <Divider className="mt-16">Unlisted</Divider>
        </>
      )}
      <Inscriptions className="w-full" inscriptions={data.inscriptions} />
      <Pagination
        pageCount={data.pages}
        pagination={pagination}
        setPagination={setPagination}
        className="mt-8"
      />
    </div>
  )
}
