import { LoaderFunctionArgs } from '@remix-run/cloudflare'
import { AsteroidClient } from '~/api/client'
import { ROIDS_ID } from '~/constants'
import { getDecimalValue } from '~/utils/number'

export async function loader({ context }: LoaderFunctionArgs) {
  const asteroidClient = new AsteroidClient(context.cloudflare.env.ASTEROID_API)
  const token = await asteroidClient.getTokenSupply(ROIDS_ID)

  if (!token) {
    return new Response(null, {
      status: 500,
      statusText: 'Server error',
    })
  }

  return new Response(
    `${getDecimalValue(token.circulating_supply, token.decimals)}`,
    {
      status: 200,
    },
  )
}
