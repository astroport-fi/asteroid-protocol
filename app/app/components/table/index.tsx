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
    <div className="flex items-center justify-center gap-2 sticky left-0">
      {total && (
        <span className="text-sm flex flex-col md:flex-row md:gap-0.5">
          Showing
          <span>
            {fromItem} to {toItem}
          </span>
          <span>of {total}</span>
        </span>
      )}
      <Button
        shape="circle"
        color="ghost"
        className="btn-sm md:btn-md"
        onClick={() => table.setPageIndex(0)}
        disabled={!table.getCanPreviousPage()}
      >
        <ChevronDoubleLeftIcon className="size-5" />
      </Button>
      <Button
        shape="circle"
        color="ghost"
        className="btn-sm md:btn-md"
        onClick={() => table.previousPage()}
        disabled={!table.getCanPreviousPage()}
      >
        <ChevronLeftIcon className="size-5" />
      </Button>
      <Button
        shape="circle"
        color="ghost"
        className="btn-sm md:btn-md"
        onClick={() => table.nextPage()}
        disabled={!table.getCanNextPage()}
      >
        <ChevronRightIcon className="size-5" />
      </Button>
      <Button
        shape="circle"
        color="ghost"
        className="btn-sm md:btn-md"
        onClick={() => table.setPageIndex(table.getPageCount() - 1)}
        disabled={!table.getCanNextPage()}
      >
        <ChevronDoubleRightIcon className="size-5" />
      </Button>
      <span className="flex flex-col md:flex-row items-center gap-1 shrink-0 text-sm">
        <span>Page</span>
        <span>
          {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
        </span>
      </span>

      <Select
        size="sm"
        className="hidden md:flex"
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
    <div
      className={twMerge('flex flex-col w-full overflow-y-scroll', className)}
    >
      <div className="flex flex-col w-full overflow-x-auto">
        <DaisyTable pinCols>
          <thead>
            <tr className={twMerge('border-neutral', headerClassName)}>
              {headerGroup.headers.map((header, index) => {
                const Cell =
                  index === 0 ? 'th' : ('td' as keyof JSX.IntrinsicElements)
                return (
                  <Cell
                    key={header.id}
                    className={clsx(
                      'lg:bg-transparent',
                      header.column.columnDef.meta?.headerClassName,
                      {
                        ['cursor-pointer select-none']:
                          header.column.getCanSort(),
                      },
                    )}
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
                  </Cell>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.id}
                className={rowClassName}
                onClick={() => onClick?.(row.original)}
              >
                {row.getVisibleCells().map((cell, index) => {
                  const Cell =
                    index === 0 ? 'th' : ('td' as keyof JSX.IntrinsicElements)

                  return (
                    <Cell
                      style={{ width: `${cell.column.getSize()}px` }}
                      key={cell.id}
                      className={twMerge(
                        'lg:bg-transparent',
                        cell.column.columnDef.meta?.className,
                      )}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </Cell>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </DaisyTable>
      </div>
      {showPagination !== false && (
        <>
          <Divider className="!mt-0" />
          <Pagination table={table} total={total} />
        </>
      )}
      {rows.length < 1 && <span className="p-4">{emptyText ?? 'No rows'}</span>}
    </div>
  )
}
