import { LoaderFunctionArgs } from '@remix-run/cloudflare'
import { json, useLoaderData } from '@remix-run/react'
import { AsteroidClient } from '~/api/client'

export async function loader({ context, params }: LoaderFunctionArgs) {
  if (!params.symbol) {
    throw new Response(null, {
      status: 404,
      statusText: 'Not Found',
    })
  }

  const asteroidClient = new AsteroidClient(context.cloudflare.env.ASTEROID_API)

  return json({})
}

export default function LaunchpadDetailPage() {
  const data = useLoaderData<typeof loader>()

  return <div className="flex flex-col w-full max-w-[1920px]"></div>
}
