import { OnChangeFn, RowSelectionState } from '@tanstack/react-table'
import { useMemo } from 'react'
import { ListingState, getListingState } from '~/api/marketplace'
import { MarketplaceTokenListing, Token } from '~/api/token'
import { useRootContext } from '~/context/root'
import useAddress from '~/hooks/useAddress'
import usePagination from '~/hooks/usePagination'
import useSorting from '~/hooks/useSorting'
import ListingsTable, { ListingsTableActions } from './ListingsTable'

const DEFAULT_SORT = { id: 'ppt', desc: false }

export default function BuyListingsTable({
  token,
  listings,
  selectedListings,
  onSelectedChange,
  className,
  actions,
  pages,
  total,
}: {
  token: Token
  listings: MarketplaceTokenListing[]
  selectedListings: MarketplaceTokenListing[]
  onSelectedChange: (listings: MarketplaceTokenListing[]) => void
  className: string
  actions: ListingsTableActions
  pages?: number
  total?: number
}) {
  const address = useAddress()
  const {
    status: { lastKnownHeight },
  } = useRootContext()
  const [sorting, setSorting] = useSorting(DEFAULT_SORT)
  const [pagination, setPagination] = usePagination(50)
  const rowSelection = useMemo(() => {
    if (!selectedListings) {
      return {}
    }

    const selection: RowSelectionState = {}
    for (const listing of selectedListings) {
      selection[listing.marketplace_listing.transaction.hash] = true
    }
    return selection
  }, [selectedListings])

  function selectionUpdater(fn: (old: RowSelectionState) => RowSelectionState) {
    const res = fn(rowSelection)
    const selectedListings = listings.filter(
      (listing) => res[listing.marketplace_listing.transaction.hash],
    )

    onSelectedChange(selectedListings)
  }

  return (
    <ListingsTable
      token={token}
      listings={listings}
      className={className}
      actions={actions}
      pages={pages}
      total={total}
      tableOptions={{
        enableRowSelection: (row) => {
          const listingState = getListingState(
            row.original.marketplace_listing,
            address,
            lastKnownHeight,
          )
          return listingState === ListingState.Reserve
        },
        state: {
          rowSelection,
          pagination,
          sorting,
        },
        pageCount: pages,
        manualPagination: true,
        manualSorting: true,
        onPaginationChange: setPagination,
        onSortingChange: setSorting,
        onRowSelectionChange: selectionUpdater as OnChangeFn<RowSelectionState>,
      }}
    />
  )
}
