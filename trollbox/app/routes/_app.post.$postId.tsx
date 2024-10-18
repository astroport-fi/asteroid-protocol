import { LoaderFunctionArgs, MetaFunction, json } from '@remix-run/cloudflare'
import { useLoaderData } from '@remix-run/react'
import { AsteroidClient } from '~/api/client'
import Post from '~/components/troll/Post'
import { postMeta } from '~/utils/meta'

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  if (!data) {
    return []
  }

  return postMeta(data)
}

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
    <div className="flex flex-col items-center w-full">
      <Post post={data} />
    </div>
  )
}
