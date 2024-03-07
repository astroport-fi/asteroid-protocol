import { useSearchParams } from '@remix-run/react'
import { PaginationState } from '@tanstack/react-table'
import { useEffect, useMemo, useState } from 'react'
import { DEFAULT_LIMIT, DEFAULT_PAGE } from '~/utils/pagination'

export default function usePagination() {
  const [searchParams, setSearchParams] = useSearchParams()

  const [{ pageIndex, pageSize }, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: DEFAULT_LIMIT,
  })

  const pagination = useMemo(
    () => ({
      pageIndex,
      pageSize,
    }),
    [pageIndex, pageSize],
  )

  useEffect(() => {
    const currentPage = searchParams.get('page') ?? `${DEFAULT_PAGE}`
    const newPage = `${pageIndex + 1}`
    if (currentPage !== newPage) {
      setSearchParams((prev) => {
        prev.set('page', newPage)
        return prev
      })
    }
  }, [pageIndex, searchParams, setSearchParams])

  useEffect(() => {
    const currentLimit = searchParams.get('limit') ?? `${DEFAULT_LIMIT}`
    const newLimit = `${pageSize}`
    if (currentLimit !== newLimit) {
      setSearchParams((prev) => {
        prev.set('limit', newLimit)
        return prev
      })
    }
  }, [pageSize, searchParams, setSearchParams])

  return [pagination, setPagination] as const
}
