import { LoaderFunctionArgs, json } from '@remix-run/cloudflare'
import { useLoaderData } from '@remix-run/react'
import { AsteroidClient } from '~/api/client'
import CollectionStatsTable from '~/components/collection/CollectionStatsTable'
import SearchInput from '~/components/form/SearchInput'
import { getCollectionsStatsOrder } from '~/utils/collection'
import { parsePagination } from '~/utils/pagination'

export async function loader({ context, request }: LoaderFunctionArgs) {
  const { searchParams } = new URL(request.url)
  const { offset, limit } = parsePagination(searchParams)
  const search = searchParams.get('search')

  const orderBy = getCollectionsStatsOrder(searchParams, 'volume')

  const asteroidClient = new AsteroidClient(context.cloudflare.env.ASTEROID_API)
  const res = await asteroidClient.getCollectionsStats(
    orderBy,
    { search },
    offset,
    limit,
    true,
  )

  return json({
    collectionsStats: res.stats,
    pages: Math.ceil(res.count! / limit),
    total: res.count!,
  })
}

export enum CollectionCategory {
  Trending,
  Top,
  New,
}

export default function CollectionsPage() {
  const data = useLoaderData<typeof loader>()

  return (
    <div className="flex flex-col w-full max-w-[1920px] overflow-y-scroll">
      <div className="flex justify-end">
        <SearchInput placeholder="Search by collection name" />
      </div>
      {data.collectionsStats.length < 1 && (
        <span className="p-4">{'No collections found'}</span>
      )}
      <CollectionStatsTable
        collectionsStats={data.collectionsStats}
        defaultSort={{ id: 'volume', desc: true }}
        pages={data.pages}
        total={data.total}
        showPagination
        showId
      />
    </div>
  )
}
