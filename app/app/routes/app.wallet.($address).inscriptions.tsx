import { order_by } from '@asteroid-protocol/sdk/client'
import { LoaderFunctionArgs, json } from '@remix-run/cloudflare'
import { Link, useLoaderData } from '@remix-run/react'
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
    return json({ inscriptions: [], pages: 0 })
  }
  const res = await asteroidClient.getInscriptions(
    offset,
    limit,
    {
      currentOwner: address,
    },
    {
      inscription: {
        id: order_by.desc,
      },
      marketplace_listing: {
        id: order_by.desc_nulls_last,
      },
    },
  )

  return json({
    inscriptions: res.inscriptions,
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
