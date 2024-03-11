import { order_by } from '@asteroid-protocol/sdk/client'
import { LoaderFunctionArgs, json } from '@remix-run/cloudflare'
import { Link, useLoaderData } from '@remix-run/react'
import { AsteroidClient } from '~/api/client'
import { Collection } from '~/api/collection'
import InscriptionImage from '~/components/InscriptionImage'
import { parseSorting } from '~/utils/pagination'

export async function loader({ context, request }: LoaderFunctionArgs) {
  const url = new URL(request.url)
  const { sort, direction } = parseSorting(url.searchParams, 'id', order_by.asc)
  // const search = url.searchParams.get('search')

  const asteroidClient = new AsteroidClient(context.cloudflare.env.ASTEROID_API)
  const res = await asteroidClient.getCollections(
    0,
    500,
    {},
    {
      [sort]: direction,
    },
  )

  return json({
    collections: res,
    // pages: Math.ceil(res.count / limit),
  })
}

const DEFAULT_SORT = { id: 'id', desc: false }

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
  return (
    <div className="grid grid-cols-fill-56 gap-4">
      {data.collections.map((collection) => (
        <CollectionBox key={collection.id} collection={collection} />
      ))}
    </div>
  )
}
