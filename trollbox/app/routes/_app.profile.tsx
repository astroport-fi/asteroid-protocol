import { LoaderFunctionArgs, json } from '@remix-run/cloudflare'
import { useLoaderData } from '@remix-run/react'
import { AsteroidClient } from '~/api/client'
import PostsList from '~/components/troll/Posts'
import { getAddress } from '~/utils/cookies'

export async function loader({ context, request, params }: LoaderFunctionArgs) {
  let address = params.address
  if (!address) {
    address = await getAddress(request)
  }

  const asteroidClient = new AsteroidClient(context.cloudflare.env.ASTEROID_API)
  const limit = 100
  const res = await asteroidClient.getTrollPosts(0, limit, { creator: address })

  return json({
    posts: res.posts,
    pages: Math.ceil(res.count / limit),
    total: res.count,
  })
}

export default function TrollBoxProfilePage() {
  const data = useLoaderData<typeof loader>()

  return (
    <div className="flex flex-col w-full overflow-y-auto">
      <h2 className="text-center text-xl mt-4 lg:mt-0">My posts</h2>
      {data.posts.length < 1 && (
        <span className="p-4 text-center">{'No troll posts found'}</span>
      )}
      <div className="flex flex-col items-center mt-4">
        <PostsList posts={data.posts} className="h-[calc(100svh-8.5rem)]" />
      </div>
    </div>
  )
}
