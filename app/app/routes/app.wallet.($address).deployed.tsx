import { LoaderFunctionArgs, json } from '@remix-run/cloudflare'
import { Link, useLoaderData } from '@remix-run/react'
import { AsteroidClient } from '~/api/client'
import GhostEmptyState from '~/components/GhostEmptyState'
import { Tokens } from '~/components/TokensGallery'
import { getAddress } from '~/utils/cookies'

export async function loader({ context, request, params }: LoaderFunctionArgs) {
  const asteroidClient = new AsteroidClient(context.cloudflare.env.ASTEROID_API)
  let address = params.address
  if (!address) {
    address = await getAddress(request)
  }
  if (!address) {
    return json({ tokens: [] })
  }
  // @todo pagination
  const tokens = await asteroidClient.getTokens(0, 500, {
    currentOwner: address,
  })

  return json({
    tokens: tokens,
  })
}

export default function WalletDeployed() {
  const data = useLoaderData<typeof loader>()
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
  return <Tokens tokens={data.tokens} />
}
