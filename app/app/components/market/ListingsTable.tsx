import {
  TableOptions,
  createColumnHelper,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { Button } from 'react-daisyui'
import { NumericFormat } from 'react-number-format'
import { ListingState, getListingState } from '~/api/marketplace'
import { MarketplaceTokenListing, Token } from '~/api/token'
import { useRootContext } from '~/context/root'
import useAddress from '~/hooks/useAddress'
import { getDateAgo } from '~/utils/date'
import { getDecimalValue } from '~/utils/number'
import AtomValue from '../AtomValue'
import IndeterminateCheckbox from '../form/IndeterminateCheckbox'
import Table from '../table'

export interface ListingsTableActions {
  reserveListing: (hash: string) => void
  buyListing: (hash: string) => void
  cancelListing: (hash: string) => void
}

export default function ListingsTable({
  token,
  listings,
  tableOptions,
  actions,
  className,
  pages,
  total,
}: {
  token: Token
  listings: MarketplaceTokenListing[]
  tableOptions: Partial<TableOptions<MarketplaceTokenListing>>
  actions: ListingsTableActions
  pages?: number
  total?: number
  className?: string
}) {
  const columnHelper = createColumnHelper<MarketplaceTokenListing>()
  const address = useAddress()
  const {
    status: { lastKnownHeight },
  } = useRootContext()

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
      meta: {
        headerClassName: 'hidden xl:table-cell',
        className: 'hidden xl:table-cell',
      },
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
    columnHelper.accessor('date_created', {
      header: 'Listed',
      meta: {
        headerClassName: 'hidden 2xl:table-cell',
        className: 'hidden 2xl:table-cell',
      },
      cell: (info) => getDateAgo(info.getValue()),
    }),
    columnHelper.accessor('marketplace_listing.transaction.hash', {
      enableSorting: false,
      header: '',
      meta: {
        className: 'text-center',
        headerClassName: 'text-center',
      },
      id: 'state',
      cell: (info) => {
        const listing = info.row.original.marketplace_listing
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
                onClick={() => actions.reserveListing(listingHash)}
              >
                Buy
              </Button>
            )
          case ListingState.Buy:
            return (
              <Button
                color="accent"
                size="sm"
                onClick={() => actions.buyListing(listingHash)}
              >
                Complete order
              </Button>
            )
          case ListingState.Cancel:
            return (
              <Button
                color="neutral"
                size="sm"
                onClick={() => actions.cancelListing(listingHash)}
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

  const table = useReactTable<MarketplaceTokenListing>({
    ...tableOptions,
    columns,
    data: listings,
    getRowId: (row) => row.marketplace_listing.transaction.hash,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <Table
      table={table}
      className={className}
      showPagination={pages != null}
      total={total}
    />
  )
}
