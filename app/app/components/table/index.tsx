import {
  ArrowsUpDownIcon,
  BarsArrowDownIcon,
  BarsArrowUpIcon,
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/20/solid'
import { Table as TableData, flexRender } from '@tanstack/react-table'
import clsx from 'clsx'
import { Button, Table as DaisyTable, Divider, Select } from 'react-daisyui'
import { twMerge } from 'tailwind-merge'

interface Props<T> {
  table: TableData<T>
  showPagination?: boolean
  className?: string
  onClick?: (row: T) => void
}

export default function Table<T = unknown>({
  table,
  showPagination,
  onClick,
  className,
}: Props<T>) {
  const headerGroup = table.getHeaderGroups()[0]
  const rows = table.getRowModel().rows
  const rowClassName = clsx({
    'hover hover:cursor-pointer': typeof onClick === 'function',
  })

  return (
    <div className={twMerge('flex flex-col w-full', className)}>
      <DaisyTable>
        <thead>
          <tr>
            {headerGroup.headers.map((header) => (
              <th
                key={header.id}
                className={clsx({
                  ['cursor-pointer select-none']: header.column.getCanSort(),
                })}
                onClick={header.column.getToggleSortingHandler()}
                colSpan={header.colSpan}
              >
                {header.column.getCanSort() ? (
                  <Button
                    className="px-0 hover:bg-transparent"
                    color="ghost"
                    endIcon={
                      {
                        asc: <BarsArrowUpIcon className="h-5 w-5" />,
                        desc: <BarsArrowDownIcon className="h-5 w-5" />,
                      }[header.column.getIsSorted() as string] ?? (
                        <ArrowsUpDownIcon className="h-5 w-5" />
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
                <td key={cell.id}>
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
          <div className="flex items-center justify-center gap-2">
            <Button
              shape="circle"
              color="ghost"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronDoubleLeftIcon className="h-5 w-5" />
            </Button>
            <Button
              shape="circle"
              color="ghost"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronLeftIcon className="h-5 w-5" />
            </Button>
            <Button
              shape="circle"
              color="ghost"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <ChevronRightIcon className="h-5 w-5" />
            </Button>
            <Button
              shape="circle"
              color="ghost"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
            >
              <ChevronDoubleRightIcon className="h-5 w-5" />
            </Button>
            <span className="flex items-center gap-1">
              <div>Page</div>
              <strong>
                {table.getState().pagination.pageIndex + 1} of{' '}
                {table.getPageCount()}
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
        </>
      )}
    </div>
  )
}
