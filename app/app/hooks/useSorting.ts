import { useSearchParams } from '@remix-run/react'
import { ColumnSort, SortingState } from '@tanstack/react-table'
import { useEffect, useState } from 'react'

function getDefaultSort(
  searchParams: URLSearchParams,
  defaultSorting: ColumnSort,
  prefix = '',
) {
  const name = prefix != '' ? `${prefix}_sort` : 'sort'
  const directionName = prefix != '' ? `${prefix}_direction` : 'direction'

  const currentSort = searchParams.get(name) ?? defaultSorting.id
  const queryDirection = searchParams.get(directionName)
  let currentDesc = defaultSorting.desc
  if (queryDirection) {
    currentDesc = queryDirection === 'desc'
  }

  return [{ id: currentSort, desc: currentDesc }]
}

export default function useSorting(defaultSorting: ColumnSort, prefix = '') {
  const [searchParams, setSearchParams] = useSearchParams()

  const [sorting, setSorting] = useState<SortingState>(
    getDefaultSort(searchParams, defaultSorting, prefix),
  )

  useEffect(() => {
    if (!sorting || sorting.length === 0) {
      return
    }

    const name = prefix != '' ? `${prefix}_sort` : 'sort'
    const directionName = prefix != '' ? `${prefix}_direction` : 'direction'

    const currentSort = searchParams.get(name) ?? defaultSorting.id
    const currentDirection =
      searchParams.get(directionName) ?? (defaultSorting.desc ? 'desc' : 'asc')

    const newSort = sorting[0].id
    const newDirection = sorting[0].desc ? 'desc' : 'asc'

    if (currentSort !== newSort || currentDirection !== newDirection) {
      setSearchParams((prev) => {
        prev.set(name, newSort)
        prev.set(directionName, newDirection)
        return prev
      })
    }
  }, [prefix, sorting, defaultSorting, searchParams, setSearchParams])

  return [sorting, setSorting] as const
}
