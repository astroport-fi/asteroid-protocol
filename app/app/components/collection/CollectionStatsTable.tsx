import { useNavigate } from '@remix-run/react'
import {
  ColumnDef,
  ColumnSort,
  TableOptions,
  createColumnHelper,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { CollectionsStatsItem } from '~/api/collection'
import usePagination from '~/hooks/usePagination'
import useSorting from '~/hooks/useSorting'
import AtomValue from '../AtomValue'
import Table from '../table'
import { CollectionCell } from './CollectionCell'

export default function CollectionStatsTable({
  collectionsStats,
  defaultSort,
  pages,
  total,
  showPagination = false,
  showId = false,
}: {
  collectionsStats: CollectionsStatsItem[]
  defaultSort: ColumnSort
  pages?: number
  total?: number
  showPagination?: boolean
  showId?: boolean
}) {
  const columnHelper = createColumnHelper<CollectionsStatsItem>()
  const [sorting, setSorting] = useSorting(defaultSort)
  const [pagination, setPagination] = usePagination()
  const navigate = useNavigate()

  let columns: ColumnDef<CollectionsStatsItem, any>[] = [
    columnHelper.accessor('collection', {
      header: 'Collection',
      meta: {
        headerClassName: 'pl-2 pb-0',
      },
      cell: (info) => <CollectionCell collection={info.getValue()} />,
    }),

    columnHelper.accessor('floor_price', {
      header: 'Floor Price',
      meta: {
        headerClassName: 'text-right pb-0',
      },
      cell: (info) => (
        <AtomValue className="justify-end" horizontal value={info.getValue()} />
      ),
    }),
    columnHelper.accessor('volume_24h', {
      header: '24h Volume',
      meta: {
        headerClassName: 'text-right pb-0',
      },
      cell: (info) => (
        <AtomValue className="justify-end" horizontal value={info.getValue()} />
      ),
    }),
    columnHelper.accessor('volume', {
      header: 'Total Volume',
      meta: {
        headerClassName: 'text-right pb-0',
      },
      cell: (info) => (
        <AtomValue className="justify-end" horizontal value={info.getValue()} />
      ),
    }),
    columnHelper.accessor('owners', {
      header: 'Owners',
      meta: {
        className: 'font-mono text-right',
        headerClassName: 'text-right pb-0',
      },
    }),
    columnHelper.accessor('supply', {
      header: 'Supply',
      meta: {
        className: 'font-mono text-right',
        headerClassName: 'text-right pb-0',
      },
    }),
  ]
  if (showId) {
    columns = [
      columnHelper.accessor('collection.id', {
        header: '#',
        size: 40,
        meta: {
          className: 'font-mono',
          headerClassName: 'pb-0',
        },
      }),
      ...columns,
    ]
  }

  const tableOptions: TableOptions<CollectionsStatsItem> = {
    columns,
    data: collectionsStats,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    manualSorting: true,
  }

  if (pagination) {
    tableOptions.pageCount = pages
    tableOptions.onPaginationChange = setPagination
    tableOptions.state!.pagination = pagination
    tableOptions.manualPagination = true
  }

  const table = useReactTable<CollectionsStatsItem>(tableOptions)

  return (
    <Table
      className="mt-4"
      rowClassName="border-0"
      headerClassName="mb-4"
      table={table}
      showPagination={showPagination}
      total={total}
      onClick={({ collection }) =>
        navigate(`/app/collection/${collection.symbol}`)
      }
    />
  )
}
