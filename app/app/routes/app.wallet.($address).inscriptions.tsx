import { LoaderFunctionArgs, json } from '@remix-run/cloudflare'
import { useLoaderData } from '@remix-run/react'
import { Inscriptions } from '~/components/Inscriptions'
import { AsteroidService } from '~/services/asteroid'
import { getAddress } from '~/utils/cookies'

export async function loader({ context, request, params }: LoaderFunctionArgs) {
  const asteroidService = new AsteroidService(context.env.ASTEROID_API)
  let address = params.address
  if (!address) {
    address = await getAddress(request)
  }
  if (!address) {
    return json({ inscriptions: [] })
  }
  const inscriptions = await asteroidService.getInscriptions(0, 500, {
    currentOwner: address,
  })

  return json({
    inscriptions: inscriptions,
  })
}

export default function WalletInscriptions() {
  const data = useLoaderData<typeof loader>()
  return <Inscriptions inscriptions={data.inscriptions} />
}
