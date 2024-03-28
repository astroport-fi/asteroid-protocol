import { order_by } from '@asteroid-protocol/sdk/client'
import { LoaderFunctionArgs, json } from '@remix-run/cloudflare'
import { Link, useLoaderData, useSearchParams } from '@remix-run/react'
import { Button, Divider } from 'react-daisyui'
import { AsteroidClient } from '~/api/client'
import clubs from '~/api/clubs'
import { TopCollection } from '~/api/collection'
import { InscriptionTradeHistory } from '~/api/inscription'
import Collections, { ClubBox } from '~/components/Collections'
import DecimalText from '~/components/DecimalText'
import Grid from '~/components/Grid'
import InscriptionImage from '~/components/InscriptionImage'
import SearchInput from '~/components/form/SearchInput'
import { parsePagination, parseSorting } from '~/utils/pagination'

export async function loader({ context, request }: LoaderFunctionArgs) {
  const url = new URL(request.url)
  const { sort, direction } = parseSorting(
    url.searchParams,
    'id',
    order_by.desc,
  )
  const { offset, limit } = parsePagination(new URL(request.url).searchParams)
  const search = url.searchParams.get('search')

  const asteroidClient = new AsteroidClient(context.cloudflare.env.ASTEROID_API)
  const transactions = await asteroidClient.getInscriptionTradeHistory(0, 50)
  const res = await asteroidClient.getCollections(
    offset,
    limit,
    { search },
    {
      [sort]: direction,
    },
  )
  const topCollections = await asteroidClient.getTopCollections()

  return json({
    collections: res.collections,
    topCollections,
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

      <div className="bg-base-300 rounded-b-xl flex flex-col py-4">
        <div className="flex flex-col px-4">
          <strong className="text-nowrap overflow-hidden text-ellipsis">
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

function TopCollection({ collection }: { collection: TopCollection }) {
  return (
    <Link
      className="carousel-item flex flex-col justify-between group relative border-mask rounded-xl"
      to={`/app/collection/${collection.symbol}`}
    >
      <InscriptionImage
        src={collection.content_path!}
        isExplicit={false}
        className="w-full h-full"
        containerClassName="size-96"
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

export default function CollectionsPage() {
  const data = useLoaderData<typeof loader>()
  const [searchParams] = useSearchParams()
  const hasSearch = !!searchParams.get('search')

  if (hasSearch) {
    return (
      <div className="flex flex-col">
        <div className="flex justify-end">
          <SearchInput placeholder="Search by collection name" />
        </div>
        {data.collections.length < 1 && (
          <span className="p-4">{'No collections found'}</span>
        )}
        <Collections collections={data.collections} />
      </div>
    )
  }

  return (
    <div className="flex flex-col">
      <div className="flex justify-end">
        <SearchInput placeholder="Search by collection name" />
      </div>

      <div className="carousel gap-5 mt-4 overflow-y-hidden overflow-x-scroll">
        {data.topCollections.map((collection) => (
          <TopCollection key={collection.id} collection={collection} />
        ))}
      </div>

      <h3 className="text-xl text-white mt-12">Inscription Clubs</h3>

      <Grid className="mt-4">
        {clubs.map((club) => (
          <ClubBox key={club.id} club={club} />
        ))}
      </Grid>

      <h3 className="text-xl text-white mt-12">Collections</h3>
      <Collections className="mt-4" collections={data.collections} />

      <h3 className="text-xl text-white mt-12">Latest Sales</h3>
      <div className="carousel gap-4 mt-4">
        {data.transactions.map((transaction) => (
          <TransactionBox key={transaction.id} transaction={transaction} />
        ))}
      </div>
    </div>
  )
}
