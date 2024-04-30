import { ChevronRightIcon } from '@heroicons/react/24/outline'
import { LoaderFunctionArgs, json } from '@remix-run/cloudflare'
import { Link, useLoaderData, useSearchParams } from '@remix-run/react'
import clsx from 'clsx'
import { useMemo } from 'react'
import { Button, Divider } from 'react-daisyui'
import { AsteroidClient } from '~/api/client'
import clubs from '~/api/clubs'
import { TopCollection } from '~/api/collection'
import { InscriptionTradeHistory } from '~/api/inscription'
import Collections, { ClubBox } from '~/components/Collections'
import DecimalText from '~/components/DecimalText'
import Grid from '~/components/Grid'
import InscriptionImage from '~/components/InscriptionImage'
import CollectionStatsTable from '~/components/collection/CollectionStatsTable'
import SearchInput from '~/components/form/SearchInput'
import { getCollectionsStatsOrder } from '~/utils/collection'
import { parsePagination } from '~/utils/pagination'

export async function loader({ context, request }: LoaderFunctionArgs) {
  const { searchParams } = new URL(request.url)

  const { offset, limit } = parsePagination(searchParams, 100)
  const search = searchParams.get('search')

  const asteroidClient = new AsteroidClient(context.cloudflare.env.ASTEROID_API)
  const transactions = await asteroidClient.getInscriptionTradeHistory(0, 50)
  const res = await asteroidClient.getCollections(offset, limit, { search })
  const topCollections = await asteroidClient.getTopCollections()
  const orderBy = getCollectionsStatsOrder(searchParams, 'volume_24h')
  const collectionsStats = await asteroidClient.getCollectionsStats(orderBy)

  return json({
    collections: res.collections,
    topCollections,
    collectionsStats: collectionsStats.stats,
    transactions,
    pages: Math.ceil(res.count / limit),
  })
}

export function TransactionBox({
  transaction,
}: {
  transaction: InscriptionTradeHistory
}) {
  const { inscription } = transaction
  return (
    <Link
      className="carousel-item flex flex-col bg-base-200 rounded-xl group"
      to={`/app/inscription/${transaction.inscription.transaction.hash}`}
    >
      <InscriptionImage
        src={inscription.content_path}
        isExplicit={inscription.is_explicit}
        mime={inscription.mime}
        className="size-60"
        containerClassName="rounded-t-xl"
      />

      <div className="bg-base-300 rounded-b-xl flex flex-col py-4 max-w-60">
        <div className="flex flex-col px-4">
          <strong className="text-nowrap whitespace-nowrap overflow-hidden text-ellipsis">
            {transaction.inscription.name}
          </strong>
        </div>
        <Divider className="my-1" />
        <div className="flex flex-col items-center">
          <span className="text-lg">
            <DecimalText value={transaction.amount_quote} suffix=" ATOM" />
          </span>
          <span className="uppercase text-sm text-header-content">
            Sale Price
          </span>
        </div>
      </div>
    </Link>
  )
}

function TopCollectionComponent({ collection }: { collection: TopCollection }) {
  return (
    <Link
      className="carousel-item flex flex-col justify-between group relative border-mask rounded-xl"
      to={`/app/collection/${collection.symbol}`}
    >
      <InscriptionImage
        src={collection.content_path!}
        isExplicit={false}
        className="w-full h-full"
        containerClassName="size-72 lg:size-96"
      />
      <div className="absolute inset-0 transition-all duration-500 bg-gradient-to-t from-black/70 via-transparent to-transparent max-md:via-black/40 group-hover:bg-black/40"></div>
      <div className="absolute flex flex-col z-10 h-full justify-end p-4 text-white-1 w-full max-md:p-2">
        <strong className="absolute text-lg bottom-4 text-nowrap overflow-hidden text-ellipsis transition duration-500 group-hover:translate-y-[-80px]">
          {collection.name}
        </strong>
        <div className="absolute w-[calc(100%-2rem)] flex flex-col py-4 translate-y-full group-hover:translate-y-0 transition duration-500">
          <Button color="primary">Explore Collection</Button>
        </div>
      </div>
    </Link>
  )
}

export enum CollectionCategory {
  Trending,
  Top,
  New,
}

export default function CollectionsPage() {
  const data = useLoaderData<typeof loader>()
  const [searchParams] = useSearchParams()
  const hasSearch = !!searchParams.get('search')
  const sort = searchParams.get('sort')
  const direction = searchParams.get('direction')
  const collectionCategory = useMemo(() => {
    if (sort == 'volume' && direction == 'desc') {
      return CollectionCategory.Top
    } else if (sort == 'id' && direction == 'desc') {
      return CollectionCategory.New
    }
    return CollectionCategory.Trending
  }, [sort, direction])

  if (hasSearch) {
    return (
      <div className="flex flex-col">
        <div className="flex justify-end">
          <SearchInput placeholder="Search by collection name" />
        </div>
        {data.collections.length < 1 && (
          <span className="p-4">{'No collections found'}</span>
        )}
        <Collections className="mt-8" collections={data.collections} />
      </div>
    )
  }

  return (
    <div className="flex flex-col w-full max-w-[1920px] ">
      <div className="flex justify-end">
        <SearchInput placeholder="Search by collection name" />
      </div>

      <div className="carousel gap-5 mt-4 overflow-y-hidden overflow-x-scroll">
        {data.topCollections.map((collection) => (
          <TopCollectionComponent key={collection.id} collection={collection} />
        ))}
      </div>

      <div className="flex mt-12 items-baseline justify-between text-md">
        <div>
          <Link
            className={clsx({
              'text-xl text-primary':
                collectionCategory === CollectionCategory.Trending,
            })}
            to="/app/inscriptions"
          >
            Trending
          </Link>
          <Link
            className={clsx('ml-3', {
              'text-xl text-primary':
                collectionCategory === CollectionCategory.Top,
            })}
            to={{
              pathname: '/app/inscriptions',
              search: 'sort=volume&direction=desc',
            }}
          >
            Top
          </Link>
          <Link
            className={clsx('ml-3', {
              'text-xl text-primary':
                collectionCategory === CollectionCategory.New,
            })}
            to={{
              pathname: '/app/inscriptions',
              search: 'sort=id&direction=desc',
            }}
          >
            New
          </Link>
        </div>
        <Link to="/app/collections" className="flex items-center">
          See All <ChevronRightIcon className="size-4" />
        </Link>
      </div>

      <CollectionStatsTable
        collectionsStats={data.collectionsStats}
        defaultSort={{ id: sort ?? 'volume_24h', desc: true }}
      />

      <h3 className="text-xl text-white mt-12">Inscription Clubs</h3>

      <Grid className="mt-4">
        {clubs.map((club) => (
          <ClubBox key={club.id} club={club} />
        ))}
      </Grid>

      <h3 className="text-xl text-white mt-12">Latest Sales</h3>
      <div className="carousel gap-4 mt-4">
        {data.transactions.map((transaction) => (
          <TransactionBox key={transaction.id} transaction={transaction} />
        ))}
      </div>
    </div>
  )
}
