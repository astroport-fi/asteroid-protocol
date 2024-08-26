import { ArrowUpTrayIcon, PencilSquareIcon } from '@heroicons/react/24/outline'
import { LoaderFunctionArgs, json } from '@remix-run/cloudflare'
import { Link, useLoaderData, useParams } from '@remix-run/react'
import { Divider } from 'react-daisyui'
import { AsteroidClient } from '~/api/client'
import Collections from '~/components/Collections'
import GhostEmptyState from '~/components/GhostEmptyState'
import Pagination from '~/components/Pagination'
import usePagination from '~/hooks/usePagination'
import useAddress from '~/hooks/wallet/useAddress'
import { getAddress } from '~/utils/cookies'
import { parsePagination } from '~/utils/pagination'

export async function loader({ context, request, params }: LoaderFunctionArgs) {
  const asteroidClient = new AsteroidClient(context.cloudflare.env.ASTEROID_API)
  const { offset, limit } = parsePagination(new URL(request.url).searchParams)
  let address = params.address
  if (!address) {
    address = await getAddress(request)
  }
  if (!address) {
    return json({ collections: [], launches: [], pages: 0, total: 0 })
  }
  const res = await asteroidClient.getCollections(offset, limit, {
    creator: address,
  })
  const launches = await asteroidClient.getCreatorLaunches(address)

  return json({
    collections: res.collections,
    launches: launches.map((launch) => launch.collection),
    pages: Math.ceil(res.count / limit),
    total: res.count,
  })
}

export default function WalletCollections() {
  const data = useLoaderData<typeof loader>()
  const [pagination, setPagination] = usePagination()
  const address = useAddress()
  const { address: paramsAddress } = useParams()
  const isOwner = address === paramsAddress || !paramsAddress

  if (data.collections.length < 1) {
    return (
      <GhostEmptyState>
        <div className="flex mt-8">
          <Link to="/app/create/collection" className="btn btn-primary">
            Create collection
          </Link>
        </div>
      </GhostEmptyState>
    )
  }
  return (
    <div className="flex pt-8 flex-col w-full overflow-y-scroll">
      {data.launches.length > 0 && (
        <>
          <Divider>Upcoming launches</Divider>
          <Collections
            className="w-full"
            collections={data.launches}
            route="/app/launchpad"
            editActions={(collection) => {
              if (!isOwner) return
              return (
                <>
                  <Link
                    className="btn btn-circle btn-sm btn-ghost"
                    to={`/app/edit/launch/${collection.symbol}`}
                    title="Upload inscriptions"
                  >
                    <ArrowUpTrayIcon className="size-4" />
                  </Link>
                  <Link
                    className="btn btn-circle btn-sm btn-ghost"
                    to={`/app/edit/collection/${collection.symbol}`}
                    title="Edit collection"
                  >
                    <PencilSquareIcon className="size-4" />
                  </Link>
                </>
              )
            }}
          />
          {data.collections.length > 0 && (
            <Divider className="mt-16">Launched collections</Divider>
          )}
        </>
      )}
      <Collections
        collections={data.collections}
        className="overflow-y-scroll overflow-x-auto"
        editActions={(collection) => {
          if (!isOwner) return
          return (
            <>
              <Link
                className="btn btn-circle btn-sm btn-ghost"
                to={`/app/create/collection/${collection.symbol}/mint/inscriptions`}
                title="Mint inscriptions"
              >
                <ArrowUpTrayIcon className="size-4" />
              </Link>
              <Link
                className="btn btn-circle btn-sm btn-ghost"
                to={`/app/edit/collection/${collection.symbol}`}
                title="Edit collection"
              >
                <PencilSquareIcon className="size-4" />
              </Link>
            </>
          )
        }}
      />
      <Pagination
        pageCount={data.pages}
        pagination={pagination}
        total={data.total}
        setPagination={setPagination}
        className="mt-8"
      />
    </div>
  )
}
