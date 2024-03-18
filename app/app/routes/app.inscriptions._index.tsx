import { order_by } from '@asteroid-protocol/sdk/client'
import { LoaderFunctionArgs, json } from '@remix-run/cloudflare'
import { Link, useLoaderData, useSearchParams } from '@remix-run/react'
import { AsteroidClient } from '~/api/client'
import clubs, { Club } from '~/api/clubs'
import { Collection } from '~/api/collection'
import InscriptionImage from '~/components/InscriptionImage'
import SearchInput from '~/components/form/SearchInput'
import { parseSorting } from '~/utils/pagination'

export async function loader({ context, request }: LoaderFunctionArgs) {
  const url = new URL(request.url)
  const { sort, direction } = parseSorting(url.searchParams, 'id', order_by.asc)
  const search = url.searchParams.get('search')

  const asteroidClient = new AsteroidClient(context.cloudflare.env.ASTEROID_API)
  const res = await asteroidClient.getCollections(
    0,
    500,
    { search },
    {
      [sort]: direction,
    },
  )

  return json({
    collections: res,
    // @todo pages: Math.ceil(res.count / limit),
  })
}

function ClubBox({ club }: { club: Club }) {
  return (
    <Link
      className="flex flex-col justify-between bg-base-200 rounded-xl"
      to={`/app/inscriptions/${club.slug}`}
    >
      <span className="flex items-center justify-center w-full h-60 rounded-t-xl text-2xl font-bold">
        &lt; {club.id}
      </span>
      <div className="bg-base-300 rounded-b-xl flex flex-col py-4">
        <div className="flex flex-col px-4">
          <strong className="text-nowrap overflow-hidden text-ellipsis">
            {club.title}
          </strong>
        </div>
      </div>
    </Link>
  )
}

function CollectionBox({ collection }: { collection: Collection }) {
  return (
    <Link
      className="flex flex-col justify-between bg-base-200 rounded-xl"
      to={`/app/collection/${collection.symbol}`}
    >
      <InscriptionImage
        src={collection.content_path!}
        isExplicit={collection.is_explicit}
        className="rounded-t-xl h-60"
      />
      <div className="bg-base-300 rounded-b-xl flex flex-col py-4">
        <div className="flex flex-col px-4">
          <strong className="text-nowrap overflow-hidden text-ellipsis">
            {collection.name}
          </strong>
        </div>
      </div>
    </Link>
  )
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
