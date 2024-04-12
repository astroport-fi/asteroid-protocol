import type { TxInscription } from '@asteroid-protocol/sdk'
import { ValueTypes, order_by } from '@asteroid-protocol/sdk/client'
import { ClockIcon } from '@heroicons/react/24/outline'
import { LoaderFunctionArgs, json } from '@remix-run/cloudflare'
import { Link, useLoaderData, useSearchParams } from '@remix-run/react'
import {
  RowSelectionState,
  TableOptions,
  createColumnHelper,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { useState } from 'react'
import { Button, Divider } from 'react-daisyui'
import { NumericFormat } from 'react-number-format'
import { AsteroidClient } from '~/api/client'
import { ListingState, getListingState } from '~/api/marketplace'
import { MarketplaceTokenListing, Token, TokenTradeHistory } from '~/api/token'
import AtomValue from '~/components/AtomValue'
import { BackHeader } from '~/components/Back'
import GhostEmptyState from '~/components/GhostEmptyState'
import InscriptionImage from '~/components/InscriptionImage'
import PercentageText from '~/components/PercentageText'
import Stat from '~/components/Stat'
import BuyDialog from '~/components/dialogs/BuyDialog'
import SellTokenDialog from '~/components/dialogs/SellTokenDialog'
import TxDialog from '~/components/dialogs/TxDialog'
import IndeterminateCheckbox from '~/components/form/IndeterminateCheckbox'
import Table from '~/components/table'
import { useRootContext } from '~/context/root'
import useAddress from '~/hooks/useAddress'
import useDialog, { useDialogWithValue } from '~/hooks/useDialog'
import { useMarketplaceOperations } from '~/hooks/useOperations'
import usePagination from '~/hooks/usePagination'
import useSorting from '~/hooks/useSorting'
import { getAddress } from '~/utils/cookies'
import { getDateAgo } from '~/utils/date'
import { getDecimalValue } from '~/utils/number'
import { parsePagination, parseSorting } from '~/utils/pagination'
import { shortAddress } from '~/utils/string'

export function getTokenMarketplaceListingSort(
  sort: string,
  direction: order_by,
): ValueTypes['marketplace_cft20_detail_order_by'] {
  if (sort === 'marketplace_listing_total') {
    return {
      marketplace_listing: {
        total: direction,
      },
    }
  } else if (sort === 'marketplace_listing_deposit_total') {
    return {
      marketplace_listing: {
        deposit_total: direction,
      },
    }
  } else {
    return {
      [sort]: direction,
    }
  }
}

export async function loader({ context, request, params }: LoaderFunctionArgs) {
  if (!params.ticker) {
    throw new Response(null, {
      status: 404,
      statusText: 'Not Found',
    })
  }

  const url = new URL(request.url)
  const { offset, limit } = parsePagination(url.searchParams)
  const { sort, direction } = parseSorting(
    url.searchParams,
    'ppt',
    order_by.asc,
  )
  const txsType = url.searchParams.get('txs')

  const address = await getAddress(request)
  const asteroidClient = new AsteroidClient(context.cloudflare.env.ASTEROID_API)
  const token = await asteroidClient.getToken(params.ticker, false, address)

  if (!token) {
    throw new Response(null, {
      status: 404,
      statusText: 'Not Found',
    })
  }

  const orderBy = getTokenMarketplaceListingSort(sort, direction)

  const res = await asteroidClient.getTokenListings(
    token.id,
    offset,
    limit,
    orderBy,
    true,
  )

  const transactions = await asteroidClient.getTokenTradeHistory(
    txsType === 'token' ? token.id : undefined,
    0,
    50,
  )

  if (address) {
    const status = await asteroidClient.getStatus(
      context.cloudflare.env.CHAIN_ID,
    )
    if (status) {
      const reservedListings = await asteroidClient.getTokenListings(
        token.id,
        0,
        100,
        orderBy,
        false,
        { currentBlock: status.last_processed_height, depositor: address },
      )
      return json({
        token,
        transactions,
        listings: res.listings,
        reservedListings: reservedListings.listings,
        pages: Math.ceil(res.count! / limit),
        total: res.count!,
      })
    }
  }

  return json({
    token,
    transactions,
    listings: res.listings,
    reservedListings: [],
    pages: Math.ceil(res.count! / limit),
    total: res.count!,
  })
}

const DEFAULT_SORT = { id: 'ppt', desc: false }

interface Operation {
  inscription: TxInscription
  feeTitle?: string
}

function ListingsTable({
  token,
  listings,
  pages,
  total,
  serverSorting,
  className,
  onListClick,
  reserved,
}: {
  token: Token
  listings: MarketplaceTokenListing[]
  pages?: number
  total?: number
  serverSorting: boolean
  onListClick: () => void
  className?: string
  reserved?: boolean
}) {
  const columnHelper = createColumnHelper<MarketplaceTokenListing>()
  const [sorting, setSorting] = useSorting(DEFAULT_SORT)
  const [pagination, setPagination] = usePagination()
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
  const address = useAddress()
  const {
    status: { lastKnownHeight },
  } = useRootContext()
  const {
    dialogRef: txDialogRef,
    value: operation,
    showDialog: showTxDialog,
  } = useDialogWithValue<Operation>()
  const {
    dialogRef: buyDialogRef,
    value: listingHash,
    showDialog: showBuyDialog,
  } = useDialogWithValue<string | string[]>()
  const operations = useMarketplaceOperations()

  function cancelListing(listingHash: string) {
    if (!operations) {
      console.warn('No address')
      return
    }

    const txInscription = operations.delist(listingHash)

    showTxDialog({ inscription: txInscription })
  }

  function buyListing(listingHash: string | string[]) {
    if (!operations) {
      console.warn('No address')
      return
    }

    operations.buy(listingHash, 'cft20').then((txInscription) => {
      showTxDialog({
        inscription: txInscription,
        feeTitle: 'Token listing price',
      })
    })
  }

  function reserveListing(listingHash: string | string[]) {
    showBuyDialog(listingHash)
  }

  const columns = [
    columnHelper.accessor((row) => row.id, {
      enableSorting: false,
      id: 'select',
      size: 40,
      header: ({ table }) => (
        <IndeterminateCheckbox
          {...{
            checked: table.getIsAllRowsSelected(),
            indeterminate: table.getIsSomeRowsSelected(),
            onChange: table.getToggleAllRowsSelectedHandler(),
          }}
        />
      ),
      cell: ({ row }) => (
        <IndeterminateCheckbox
          {...{
            checked: row.getIsSelected(),
            disabled: !row.getCanSelect(),
            indeterminate: row.getIsSomeSelected(),
            onChange: row.getToggleSelectedHandler(),
          }}
        />
      ),
    }),
    columnHelper.accessor('id', {
      size: 40,
      header: 'Listing #',
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor('ppt', {
      header: 'ATOM per Token',
      cell: (info) => <AtomValue value={info.getValue()} />,
    }),
    columnHelper.accessor('amount', {
      header: `${token.ticker} Tokens`,
      cell: (info) => (
        <NumericFormat
          className="font-mono"
          displayType="text"
          thousandSeparator
          value={getDecimalValue(info.getValue(), token.decimals)}
        />
      ),
    }),
    columnHelper.accessor('marketplace_listing.total', {
      header: 'Total Atom',
      cell: (info) => <AtomValue value={info.getValue()} />,
    }),
    columnHelper.accessor('marketplace_listing.deposit_total', {
      header: 'Minimum Deposit',
      meta: {
        className: 'font-mono',
      },
      cell: (info) => (
        <PercentageText
          value={info.getValue() / info.row.original.marketplace_listing.total}
        />
      ),
    }),
    columnHelper.accessor('date_created', {
      header: 'Listed',
      cell: (info) => getDateAgo(info.getValue()),
    }),
    columnHelper.accessor('marketplace_listing.transaction.hash', {
      enableSorting: false,
      header: () => {
        const selected = Object.keys(rowSelection)
        const selectedLen = selected.length
        if (selectedLen < 1) {
          return
        }

        if (reserved) {
          return (
            <Button
              color="accent"
              size="sm"
              onClick={() => buyListing(selected)}
            >
              Complete {selectedLen} listings
            </Button>
          )
        }

        return (
          <Button
            color="accent"
            size="sm"
            onClick={() => reserveListing(selected)}
          >
            Buy {selectedLen} listings
          </Button>
        )
      },
      meta: {
        className: 'text-center',
        headerClassName: 'text-center',
      },
      id: 'state',
      cell: (info) => {
        const listing = info.row.original.marketplace_listing
        // const blocks = (listing.depositor_timedout_block ?? 0) - lastKnownHeight
        const listingHash = listing.transaction.hash

        switch (
          getListingState(
            info.row.original.marketplace_listing,
            address,
            lastKnownHeight,
          )
        ) {
          case ListingState.Reserve:
            return (
              <Button
                color="accent"
                size="sm"
                onClick={() => reserveListing(listingHash)}
              >
                Buy
              </Button>
            )
          case ListingState.Buy:
            return (
              <Button
                color="accent"
                size="sm"
                onClick={() => buyListing(listingHash)}
              >
                Complete order
              </Button>
            )
          case ListingState.Cancel:
            return (
              <Button
                color="neutral"
                size="sm"
                onClick={() => cancelListing(listingHash)}
              >
                Cancel
              </Button>
            )
          case ListingState.Reserved:
            return `Reserved`
        }
      },
    }),
  ]

  const tableOptions: TableOptions<MarketplaceTokenListing> = {
    columns,
    enableRowSelection: (row) => {
      const listingState = getListingState(
        row.original.marketplace_listing,
        address,
        lastKnownHeight,
      )
      return reserved
        ? listingState === ListingState.Buy
        : listingState === ListingState.Reserve
    },
    data: listings,
    state: {
      rowSelection,
    },
    onRowSelectionChange: setRowSelection,
    getRowId: (row) => row.marketplace_listing.transaction.hash,
    getCoreRowModel: getCoreRowModel(),
  }

  if (pages) {
    tableOptions.pageCount = pages
    tableOptions.onPaginationChange = setPagination
    tableOptions.state!.pagination = pagination
    tableOptions.manualPagination = true
  }

  if (serverSorting) {
    tableOptions.onSortingChange = setSorting
    tableOptions.state!.sorting = sorting
    tableOptions.manualSorting = true
  } else {
    tableOptions.getSortedRowModel = getSortedRowModel()
  }

  const table = useReactTable<MarketplaceTokenListing>(tableOptions)

  return (
    <>
      {listings.length < 1 ? (
        <GhostEmptyState text="Be the first to create a listing for this token.">
          <Button
            color="primary"
            className="mt-6"
            onClick={() => onListClick()}
          >
            Sell {token.ticker} tokens
          </Button>
        </GhostEmptyState>
      ) : (
        <Table
          table={table}
          className={className}
          showPagination={pages != null}
          total={total}
        />
      )}

      <TxDialog
        ref={txDialogRef}
        txInscription={operation?.inscription ?? null}
        feeOperationTitle={operation?.feeTitle}
        resultCTA="Back to market"
        resultLink={`/app/market/${token.ticker}`}
      />
      <BuyDialog
        buyType="cft20"
        listingHash={listingHash}
        ref={buyDialogRef}
        resultLink={`/app/market/${token.ticker}`}
      />
    </>
  )
}

function Stats({ token }: { token: Token }) {
  return (
    <div className="flex flex-row gap-8 mt-4">
      <Stat title={`Price`}>
        <AtomValue value={token.last_price_base} horizontal />
      </Stat>
      <Stat title="24H Volume">
        <AtomValue value={token.volume_24_base} horizontal />
      </Stat>
    </div>
  )
}

function LatestTransactions({
  token,
  transactions,
}: {
  token: Token
  transactions: TokenTradeHistory[]
}) {
  const [searchParams, setSearchParams] = useSearchParams()
  const txs = searchParams.get('txs')
  const tokenOnlyTxs = txs === 'token'

  return (
    <div className="flex-col shrink-0 items-center w-96 border-l border-l-neutral hidden lg:flex text-center">
      <div className="fixed py-8 flex flex-col w-available">
        <div className="text-lg">Latest transactions</div>
        <div className="flex justify-center items-center text-sm">
          <button
            className={tokenOnlyTxs ? 'text-header-content' : 'text-primary'}
            onClick={() =>
              setSearchParams((prev) => {
                prev.delete('txs')
                return prev
              })
            }
          >
            All
          </button>{' '}
          <span className="mx-1">|</span>
          <button
            className={tokenOnlyTxs ? 'text-primary' : 'text-header-content'}
            onClick={() =>
              setSearchParams((prev) => {
                prev.set('txs', 'token')
                return prev
              })
            }
          >
            {token.ticker} only
          </button>
        </div>
        <div className="flex flex-row justify-between mt-4 uppercase text-header-content px-4">
          <span className="p-2 w-1/12">
            <ClockIcon className="size-5" />
          </span>
          <span className="p-2 w-3/12">Amount</span>
          <span className="p-2 w-2/12">Price</span>
          <span className="p-2 w-2/12">Seller</span>
          <span className="p-2 w-2/12">Buyer</span>
        </div>
        <Divider className="my-1" />
        <div className="overflow-y-scroll no-scrollbar h-[calc(100vh-250px)]">
          {transactions.length < 1 && (
            <span>No transactions for {token.ticker}</span>
          )}
          {transactions.map((tx) => (
            <span
              key={tx.id}
              className="flex flex-row justify-between items-center w-full rounded-none px-4 py-3 border-b border-b-neutral text-sm"
            >
              <span className="mx-1 shrink-0 w-1/12">
                {getDateAgo(tx.date_created, true)}
              </span>
              <Link
                to={`/app/market/${tx.token.ticker}`}
                className="shrink-0 w-3/12 flex flex-col font-mono items-center hover:text-primary"
              >
                <NumericFormat
                  displayType="text"
                  thousandSeparator
                  value={getDecimalValue(tx.amount_base, 6)}
                />
                <span className="mt-1">{tx.token.ticker}</span>
              </Link>
              <span className="shrink-0 w-2/12 flex flex-col font-mono items-center">
                <NumericFormat
                  displayType="text"
                  thousandSeparator
                  value={getDecimalValue(tx.amount_quote, 6)}
                />
                <span className="mt-1">ATOM</span>
              </span>
              <Link
                to={`/app/wallet/${tx.seller_address}`}
                className="shrink-0 w-2/12 hover:text-primary"
                onClick={(e) => e.stopPropagation()}
              >
                {shortAddress(tx.seller_address)}
              </Link>
              <Link
                to={`/app/wallet/${tx.buyer_address}`}
                className="shrink-0 w-2/12 hover:text-primary"
                onClick={(e) => e.stopPropagation()}
              >
                {shortAddress(tx.buyer_address!)}
              </Link>
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function MarketPage() {
  const data = useLoaderData<typeof loader>()
  const { dialogRef, showDialog } = useDialog()
  const amount = data.token.token_holders?.[0]?.amount
  const { token } = data
  const minted = token.circulating_supply / token.max_supply

  return (
    <div className="flex flex-row h-full">
      <div className="flex flex-col w-full h-full">
        <div className="flex flex-col mb-2 mt-8 px-8">
          <div className="flex flex-row justify-between">
            <BackHeader to="/app/tokens">
              <InscriptionImage
                mime="image/png"
                src={token.content_path!}
                // isExplicit={token.is_explicit} @todo
                className="size-6"
                imageClassName="rounded-xl"
              />
              <span className="ml-2 flex items-baseline">
                Trade {token.name}
                <span className="text-sm font-light text-header-content ml-1">
                  {token.ticker}
                </span>
              </span>
            </BackHeader>
            <div>
              {minted < 1 && (
                <Link
                  className="btn btn-primary btn-sm mr-2"
                  to={`/app/token/${token.ticker}`}
                >
                  Mint now
                </Link>
              )}
              <Button color="primary" size="sm" onClick={() => showDialog()}>
                Sell {token.ticker} tokens
              </Button>{' '}
              <SellTokenDialog
                ref={dialogRef}
                ticker={token.ticker}
                tokenAmount={amount ?? 0}
                lastPrice={getDecimalValue(
                  token.last_price_base,
                  token.decimals,
                )}
              />
            </div>
          </div>
          <Stats token={token} />
        </div>
        {data.reservedListings?.length > 0 && (
          <div className="ml-8">
            <h3 className="mt-10 text-lg">Your reserved listing</h3>
            <ListingsTable
              className="mt-2"
              listings={data.reservedListings}
              token={token}
              onListClick={() => showDialog()}
              serverSorting={false}
              reserved
            />
            <h3 className="mt-16 text-lg">All listings</h3>
          </div>
        )}

        <ListingsTable
          className="mt-2 mb-6 px-8 overflow-y-scroll"
          listings={data.listings}
          pages={data.pages}
          total={data.total}
          token={token}
          onListClick={() => showDialog()}
          serverSorting={true}
        />
      </div>
      <LatestTransactions token={token} transactions={data.transactions} />
    </div>
  )
}
