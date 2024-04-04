import {
  ArrowsUpDownIcon,
  BarsArrowDownIcon,
  BarsArrowUpIcon,
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/20/solid'
import { RowData, Table as TableData, flexRender } from '@tanstack/react-table'
import clsx from 'clsx'
import { Button, Table as DaisyTable, Divider, Select } from 'react-daisyui'
import { twMerge } from 'tailwind-merge'

declare module '@tanstack/table-core' {
  interface ColumnMeta<TData extends RowData, TValue> {
    className?: string
    headerClassName?: string
  }
}

interface Props<T> {
  table: TableData<T>
  showPagination?: boolean
  total?: number
  className?: string
  rowClassName?: string
  headerClassName?: string
  emptyText?: string
  onClick?: (row: T) => void
}

function Pagination<T>({
  table,
  total,
}: {
  table: TableData<T>
  total?: number
}) {
  const { pageIndex, pageSize } = table.getState().pagination

  const fromItem = pageIndex * pageSize + 1
  const toItem = Math.min(fromItem + pageSize - 1, total ?? 0)

  return (
    <div className="flex items-center justify-center gap-2">
      {total && (
        <span className="text-sm">
          Showing {fromItem} to {toItem} of {total}
        </span>
      )}
      <Button
        shape="circle"
        color="ghost"
        onClick={() => table.setPageIndex(0)}
        disabled={!table.getCanPreviousPage()}
      >
        <ChevronDoubleLeftIcon className="size-5" />
      </Button>
      <Button
        shape="circle"
        color="ghost"
        onClick={() => table.previousPage()}
        disabled={!table.getCanPreviousPage()}
      >
        <ChevronLeftIcon className="size-5" />
      </Button>
      <Button
        shape="circle"
        color="ghost"
        onClick={() => table.nextPage()}
        disabled={!table.getCanNextPage()}
      >
        <ChevronRightIcon className="size-5" />
      </Button>
      <Button
        shape="circle"
        color="ghost"
        onClick={() => table.setPageIndex(table.getPageCount() - 1)}
        disabled={!table.getCanNextPage()}
      >
        <ChevronDoubleRightIcon className="size-5" />
      </Button>
      <span className="flex items-center gap-1">
        <div>Page</div>
        <strong>
          {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
        </strong>
      </span>

      <Select
        size="sm"
        value={table.getState().pagination.pageSize}
        onChange={(e) => {
          table.setPageSize(Number(e.target.value))
        }}
      >
        {[10, 20, 30, 40, 50].map((pageSize) => (
          <option key={pageSize} value={pageSize}>
            Show {pageSize}
          </option>
        ))}
      </Select>
    </div>
  )
}

export default function Table<T = unknown>({
  table,
  showPagination,
  total,
  onClick,
  className,
  rowClassName: rowClassNameProp,
  headerClassName,
  emptyText,
}: Props<T>) {
  const headerGroup = table.getHeaderGroups()[0]
  const rows = table.getRowModel().rows
  const rowClassName = twMerge(
    clsx(rowClassNameProp, {
      'hover hover:cursor-pointer': typeof onClick === 'function',
    }),
  )
  showPagination = showPagination !== false && rows.length > 0

  return (
    <div className={twMerge('flex flex-col w-full', className)}>
      <DaisyTable>
        <thead>
          <tr className={twMerge('border-neutral', headerClassName)}>
            {headerGroup.headers.map((header) => (
              <th
                key={header.id}
                className={clsx(header.column.columnDef.meta?.headerClassName, {
                  ['cursor-pointer select-none']: header.column.getCanSort(),
                })}
                style={{ width: `${header.getSize()}px` }}
                onClick={header.column.getToggleSortingHandler()}
                colSpan={header.colSpan}
              >
                {header.column.getCanSort() ? (
                  <Button
                    className="px-0 hover:bg-transparent"
                    color="ghost"
                    endIcon={
                      {
                        asc: <BarsArrowUpIcon className="size-5" />,
                        desc: <BarsArrowDownIcon className="size-5" />,
                      }[header.column.getIsSorted() as string] ?? (
                        <ArrowsUpDownIcon className="size-5" />
                      )
                    }
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </Button>
                ) : header.isPlaceholder ? null : (
                  flexRender(
                    header.column.columnDef.header,
                    header.getContext(),
                  )
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.id}
              className={rowClassName}
              onClick={() => onClick?.(row.original)}
            >
              {row.getVisibleCells().map((cell) => (
                <td
                  style={{ width: `${cell.column.getSize()}px` }}
                  key={cell.id}
                  className={cell.column.columnDef.meta?.className}
                >
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </DaisyTable>
      {showPagination !== false && (
        <>
          <Divider />
          <Pagination table={table} total={total} />
        </>
      )}
      {rows.length < 1 && <span className="p-4">{emptyText ?? 'No rows'}</span>}
    </div>
  )
}
