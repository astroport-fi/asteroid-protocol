import { LoaderFunctionArgs, json } from '@remix-run/cloudflare'
import { useLoaderData } from '@remix-run/react'
import { AsteroidClient } from '~/api/client'
import Post from '~/components/troll/Post'

// @todo meta tags

export async function loader({ context, params }: LoaderFunctionArgs) {
  const asteroidClient = new AsteroidClient(context.cloudflare.env.ASTEROID_API)

  if (!params.postId) {
    throw new Response(null, {
      status: 404,
      statusText: 'Not Found',
    })
  }

  const post = await asteroidClient.getTrollPost(parseInt(params.postId, 10))

  return json(post)
}

export default function TrollBoxProfilePage() {
  const data = useLoaderData<typeof loader>()

  return (
    <div className="flex flex-col w-full overflow-y-scroll">
      <div className="flex flex-col items-center mt-4">
        <Post post={data} />
      </div>
    </div>
  )
}
