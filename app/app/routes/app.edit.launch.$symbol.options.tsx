import { LoaderFunctionArgs, json } from '@remix-run/cloudflare'
import { AsteroidClient } from '~/api/client'
import CreateCollectionLaunch from './app.create.launch.($symbol)._index'

export async function loader({ context, params }: LoaderFunctionArgs) {
  if (!params.symbol) {
    throw new Response(null, {
      status: 404,
      statusText: 'Not Found',
    })
  }

  const asteroidClient = new AsteroidClient(context.cloudflare.env.ASTEROID_API)
  const launchpad = await asteroidClient.getLaunchpad(params.symbol)

  return json({ collections: [], launchpad })
}

export default CreateCollectionLaunch
