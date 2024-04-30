import {
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/20/solid'
import { PaginationState } from '@tanstack/react-table'
import { Button, Select } from 'react-daisyui'
import { twMerge } from 'tailwind-merge'

interface Props {
  pageCount: number
  total: number
  pagination: PaginationState
  setPagination: React.Dispatch<React.SetStateAction<PaginationState>>
  className?: string
}

export default function Pagination({
  pageCount,
  total,
  pagination: { pageIndex, pageSize },
  setPagination,
  className,
}: Props) {
  const getCanPreviousPage = () => pageIndex > 0

  const getCanNextPage = () => {
    if (pageCount === -1) {
      return true
    }

    if (pageCount === 0) {
      return false
    }

    return pageIndex < pageCount - 1
  }

  const setPageIndex = (updater: ((prevIndex: number) => number) | number) => {
    setPagination((old) => {
      let newPageIndex =
        typeof updater === 'function' ? updater(old.pageIndex) : updater

      const maxPageIndex = pageCount - 1

      newPageIndex = Math.max(0, Math.min(newPageIndex, maxPageIndex))

      return {
        ...old,
        pageIndex: newPageIndex,
      }
    })
  }

  const setPageSize = (newValue: number) => {
    setPagination((old) => {
      const newPageSize = Math.max(1, newValue)
      const topRowIndex = old.pageSize * old.pageIndex!
      const newPageIndex = Math.floor(topRowIndex / newPageSize)

      return {
        ...old,
        pageIndex: newPageIndex,
        pageSize: newPageSize,
      }
    })
  }

  const previousPage = () => {
    return setPageIndex((old) => old - 1)
  }

  const nextPage = () => {
    return setPageIndex((old) => {
      return old + 1
    })
  }

  const fromItem = pageIndex * pageSize + 1
  const toItem = Math.min(fromItem + pageSize - 1, total)

  return (
    <div
      className={twMerge(
        'flex items-center justify-center gap-2 sticky left-0',
        className,
      )}
    >
      <span className="text-sm flex flex-col md:flex-row md:gap-0.5">
        Showing
        <span>
          {fromItem} to {toItem}
        </span>
        <span>of {total}</span>
      </span>
      <Button
        className="ml-4 btn-sm md:btn-md"
        shape="circle"
        color="ghost"
        onClick={() => setPageIndex(0)}
        disabled={!getCanPreviousPage()}
      >
        <ChevronDoubleLeftIcon className="size-5" />
      </Button>
      <Button
        className="btn-sm md:btn-md"
        shape="circle"
        color="ghost"
        onClick={() => previousPage()}
        disabled={!getCanPreviousPage()}
      >
        <ChevronLeftIcon className="size-5" />
      </Button>
      <Button
        className="btn-sm md:btn-md"
        shape="circle"
        color="ghost"
        onClick={() => nextPage()}
        disabled={!getCanNextPage()}
      >
        <ChevronRightIcon className="size-5" />
      </Button>
      <Button
        className="btn-sm md:btn-md"
        shape="circle"
        color="ghost"
        onClick={() => setPageIndex(pageCount - 1)}
        disabled={!getCanNextPage()}
      >
        <ChevronDoubleRightIcon className="size-5" />
      </Button>
      <span className="flex flex-col md:flex-row items-center gap-1 shrink-0 text-sm">
        <span>Page</span>
        <span>
          {pageIndex + 1} of {pageCount}
        </span>
      </span>
      <Select
        size="sm"
        className="hidden md:flex"
        value={pageSize}
        onChange={(e) => {
          setPageSize(Number(e.target.value))
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
