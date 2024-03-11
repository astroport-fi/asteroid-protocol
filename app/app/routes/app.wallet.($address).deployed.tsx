import { LoaderFunctionArgs, json } from '@remix-run/cloudflare'
import { Link, useLoaderData } from '@remix-run/react'
import { AsteroidClient } from '~/api/client'
import GhostEmptyState from '~/components/GhostEmptyState'
import Pagination from '~/components/Pagination'
import { Tokens } from '~/components/TokensGallery'
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
    return json({ tokens: [], pages: 0 })
  }
  const res = await asteroidClient.getTokens(offset, limit, {
    currentOwner: address,
  })

  return json({
    tokens: res.tokens,
    pages: Math.ceil(res.count / limit),
  })
}

export default function WalletDeployed() {
  const data = useLoaderData<typeof loader>()
  const [pagination, setPagination] = usePagination()

  if (data.tokens.length < 1) {
    return (
      <GhostEmptyState>
        <div className="flex mt-8">
          <Link to="/app/create/token" className="btn btn-primary">
            Create token
          </Link>
          <Link to="/app/tokens" className="btn btn-primary ml-4">
            Buy tokens
          </Link>
        </div>
      </GhostEmptyState>
    )
  }
  return (
    <div>
      <Tokens tokens={data.tokens} />
      <Pagination
        pageCount={data.pages}
        pagination={pagination}
        setPagination={setPagination}
        className="mt-8"
      />
    </div>
  )
}
