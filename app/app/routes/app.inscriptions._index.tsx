import { order_by } from '@asteroid-protocol/sdk/client'
import { LoaderFunctionArgs, json } from '@remix-run/cloudflare'
import { Link, useLoaderData, useSearchParams } from '@remix-run/react'
import { AsteroidClient } from '~/api/client'
import clubs, { Club } from '~/api/clubs'
import { Collection } from '~/api/collection'
import { ClubBox, CollectionBox } from '~/components/Collections'
import InscriptionImage from '~/components/InscriptionImage'
import SearchInput from '~/components/form/SearchInput'
import { parsePagination, parseSorting } from '~/utils/pagination'

export async function loader({ context, request }: LoaderFunctionArgs) {
  const url = new URL(request.url)
  const { sort, direction } = parseSorting(url.searchParams, 'id', order_by.asc)
  const { offset, limit } = parsePagination(new URL(request.url).searchParams)
  const search = url.searchParams.get('search')

  const asteroidClient = new AsteroidClient(context.cloudflare.env.ASTEROID_API)
  const res = await asteroidClient.getCollections(
    offset,
    limit,
    { search },
    {
      [sort]: direction,
    },
  )

  return json({
    collections: res.collections,
    pages: Math.ceil(res.count / limit),
  })
}

export default function CollectionsPage() {
  const data = useLoaderData<typeof loader>()
  const [searchParams] = useSearchParams()
  const hasSearch = !!searchParams.get('search')

  return (
    <div className="flex flex-col">
      <div className="flex justify-end">
        <SearchInput placeholder="Search by collection name" />
      </div>
      <div className="grid grid-cols-fill-56 gap-4 mt-8">
        {!hasSearch &&
          clubs.map((club) => <ClubBox key={club.id} club={club} />)}
        {data.collections.length < 1 && (
          <span className="p-4">{'No collections found'}</span>
        )}
        {data.collections.map((collection) => (
          <CollectionBox key={collection.id} collection={collection} />
        ))}
      </div>
    </div>
  )
}
