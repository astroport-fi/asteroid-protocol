import { RowSelectionState, getSortedRowModel } from '@tanstack/react-table'
import { useState } from 'react'
import { MarketplaceTokenListing, Token } from '~/api/token'
import ListingsTable, { ListingsTableActions } from './ListingsTable'

export default function ReservedListingsTable({
  token,
  listings,
  className,
  actions,
}: {
  token: Token
  listings: MarketplaceTokenListing[]
  className: string
  actions: ListingsTableActions
}) {
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})

  return (
    <ListingsTable
      token={token}
      listings={listings}
      className={className}
      actions={actions}
      headerAction
      tableOptions={{
        enableRowSelection: true,
        state: {
          rowSelection,
        },
        onRowSelectionChange: setRowSelection,
        getSortedRowModel: getSortedRowModel(),
      }}
    />
  )
}
