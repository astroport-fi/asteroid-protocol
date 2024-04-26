import { LoaderFunctionArgs, json } from '@remix-run/cloudflare'
import { Link, useLoaderData } from '@remix-run/react'
import { AsteroidClient } from '~/api/client'
import Collections from '~/components/Collections'
import GhostEmptyState from '~/components/GhostEmptyState'
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
    return json({ collections: [], pages: 0, total: 0 })
  }
  const res = await asteroidClient.getCollections(offset, limit, {
    creator: address,
  })

  return json({
    collections: res.collections,
    pages: Math.ceil(res.count / limit),
    total: res.count,
  })
}

export default function WalletCollections() {
  const data = useLoaderData<typeof loader>()
  const [pagination, setPagination] = usePagination()

  if (data.collections.length < 1) {
    return (
      <GhostEmptyState>
        <div className="flex mt-8">
          <Link to="/app/create/collection" className="btn btn-primary">
            Create collection
          </Link>
        </div>
      </GhostEmptyState>
    )
  }
  return (
    <div className="flex pt-8 flex-col w-full overflow-y-scroll">
      <Collections
        collections={data.collections}
        className="overflow-y-scroll overflow-x-auto"
      />
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
