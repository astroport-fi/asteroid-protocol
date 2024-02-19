import { LoaderFunctionArgs, json } from '@remix-run/cloudflare'
import { useLoaderData } from '@remix-run/react'
import { Inscriptions } from '~/components/Inscriptions'
import { AsteroidService } from '~/services/asteroid'
import { parsePagination } from '~/utils/pagination'

export async function loader({ context, request }: LoaderFunctionArgs) {
  // @todo offset, limit
  const { offset, limit } = parsePagination(new URL(request.url).searchParams)
  const asteroidService = new AsteroidService(context.env.ASTEROID_API)
  const inscriptions = await asteroidService.getInscriptions(0, 500)

  return json({
    inscriptions: inscriptions,
  })
}

export default function InscriptionsPage() {
  const data = useLoaderData<typeof loader>()
  return <Inscriptions inscriptions={data.inscriptions} />
}
