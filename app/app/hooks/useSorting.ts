import { useSearchParams } from '@remix-run/react'
import { ColumnSort, SortingState } from '@tanstack/react-table'
import { useEffect, useState } from 'react'

export default function useSorting(defaultSorting: ColumnSort) {
  const [searchParams, setSearchParams] = useSearchParams()

  const [sorting, setSorting] = useState<SortingState>([defaultSorting])

  useEffect(() => {
    if (!sorting || sorting.length === 0) {
      return
    }

    const currentSort = searchParams.get('sort') ?? defaultSorting.id
    const currentDirection =
      searchParams.get('direction') ?? (defaultSorting.desc ? 'desc' : 'asc')

    const newSort = sorting[0].id
    const newDirection = sorting[0].desc ? 'desc' : 'asc'

    if (currentSort !== newSort || currentDirection !== newDirection) {
      setSearchParams((prev) => {
        prev.set('sort', newSort)
        prev.set('direction', newDirection)
        return prev
      })
    }
  }, [sorting, defaultSorting, searchParams, setSearchParams])

  return [sorting, setSorting] as const
}
