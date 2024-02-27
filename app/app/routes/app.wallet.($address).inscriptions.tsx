import { LoaderFunctionArgs, json } from '@remix-run/cloudflare'
import { useLoaderData } from '@remix-run/react'
import { AsteroidClient } from '~/api/client'
import { Inscriptions } from '~/components/Inscriptions'
import { getAddress } from '~/utils/cookies'

export async function loader({ context, request, params }: LoaderFunctionArgs) {
  const asteroidClient = new AsteroidClient(context.cloudflare.env.ASTEROID_API)
  let address = params.address
  if (!address) {
    address = await getAddress(request)
  }
  if (!address) {
    return json({ inscriptions: [] })
  }
  const res = await asteroidClient.getInscriptions(0, 500, {
    currentOwner: address,
  })

  return json({
    inscriptions: res.inscriptions,
  })
}

export default function WalletInscriptions() {
  const data = useLoaderData<typeof loader>()
  return <Inscriptions inscriptions={data.inscriptions} />
}
