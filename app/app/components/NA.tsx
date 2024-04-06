import type { ReactNode } from 'react'

type Props<T> = {
  value: T | null | undefined
  children: (value: T) => ReactNode
}

export default function NA<T>({ value, children }: Props<T>) {
  if (value == null) {
    return '-'
  }

  return children(value)
}
