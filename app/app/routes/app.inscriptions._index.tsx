import { order_by } from '@asteroid-protocol/sdk/client'
import { LoaderFunctionArgs, json } from '@remix-run/cloudflare'
import { Link, useLoaderData, useSearchParams } from '@remix-run/react'
import { Divider } from 'react-daisyui'
import { AsteroidClient } from '~/api/client'
import clubs from '~/api/clubs'
import { InscriptionTradeHistory } from '~/api/inscription'
import Collections, { ClubBox } from '~/components/Collections'
import DecimalText from '~/components/DecimalText'
import Grid from '~/components/Grid'
import InscriptionImage from '~/components/InscriptionImage'
import SearchInput from '~/components/form/SearchInput'
import { parsePagination, parseSorting } from '~/utils/pagination'

export async function loader({ context, request }: LoaderFunctionArgs) {
  const url = new URL(request.url)
  const { sort, direction } = parseSorting(url.searchParams, 'id', order_by.asc)
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

  return json({
    collections: res.collections,
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
      className="carousel-item flex flex-col bg-base-200 rounded-xl"
      to={`/app/inscription/${transaction.inscription.transaction.hash}`}
    >
      <InscriptionImage
        className="rounded-t-xl h-60 w-60"
        src={inscription.content_path}
        isExplicit={inscription.is_explicit}
        mime={inscription.mime}
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

      <h3 className="text-xl text-white">Inscription Clubs</h3>

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
