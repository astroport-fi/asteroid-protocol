import { LoaderFunctionArgs, json } from '@remix-run/cloudflare'
import { useLoaderData } from '@remix-run/react'
import { Tokens } from '~/components/TokensGallery'
import { AsteroidService } from '~/services/asteroid'
import { getAddress } from '~/utils/cookies'

export async function loader({ context, request, params }: LoaderFunctionArgs) {
  const asteroidService = new AsteroidService(context.env.ASTEROID_API)
  let address = params.address
  if (!address) {
    address = await getAddress(request)
  }
  if (!address) {
    return json({ tokens: [] })
  }
  const tokens = await asteroidService.getTokens(0, 500, {
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
