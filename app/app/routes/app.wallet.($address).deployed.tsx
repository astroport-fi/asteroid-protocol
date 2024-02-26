import { LoaderFunctionArgs, json } from '@remix-run/cloudflare'
import { useLoaderData } from '@remix-run/react'
import { AsteroidClient } from '~/api/client'
import { Tokens } from '~/components/TokensGallery'
import { getAddress } from '~/utils/cookies'

export async function loader({ context, request, params }: LoaderFunctionArgs) {
  const asteroidClient = new AsteroidClient(context.env.ASTEROID_API)
  let address = params.address
  if (!address) {
    address = await getAddress(request)
  }
  if (!address) {
    return json({ tokens: [] })
  }
  const tokens = await asteroidClient.getTokens(0, 500, {
    currentOwner: address,
  })

  return json({
    tokens: tokens,
  })
}

export default function WalletDeployed() {
  const data = useLoaderData<typeof loader>()
  return <Tokens tokens={data.tokens} />
}
