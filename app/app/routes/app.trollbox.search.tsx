import { LoaderFunctionArgs, json } from '@remix-run/cloudflare'
import { useLoaderData } from '@remix-run/react'
import { AsteroidClient } from '~/api/client'
import SearchInputForm from '~/components/form/SearchInput'
import PostsList from '~/components/troll/Posts'

export async function loader({ context, request }: LoaderFunctionArgs) {
  const { searchParams } = new URL(request.url)
  const search = searchParams.get('search')

  const asteroidClient = new AsteroidClient(context.cloudflare.env.ASTEROID_API)
  const limit = 100
  const res = await asteroidClient.getTrollPosts(0, limit, { search })

  return json({
    posts: res.posts,
    pages: Math.ceil(res.count / limit),
    total: res.count,
  })
}

export default function TrollBoxSearchPage() {
  const data = useLoaderData<typeof loader>()

  return (
    <div className="flex flex-col w-full overflow-y-scroll">
      <div className="flex justify-center mt-2">
        <SearchInputForm placeholder="Search by text" />
      </div>
      {data.posts.length < 1 && (
        <span className="p-4 text-center">{'No troll posts found'}</span>
      )}
      <div className="flex flex-col items-center mt-4">
        <PostsList posts={data.posts} className="h-[calc(100svh-12.5rem)]" />
      </div>
    </div>
  )
}
