import { useEffect, useState } from 'react'
import { getStargazeName } from '~/api/stargaze'
import { getEllipsisTxt } from '~/utils/string'

interface Props {
  address: string
  full?: boolean
  start?: number
}

export default function Address({ address, full, start }: Props) {
  const [stargazeName, setStargazeName] = useState<string | null>(null)
  useEffect(() => {
    getStargazeName(address).then(setStargazeName)
  }, [address])

  if (stargazeName) {
    return stargazeName
  }

  if (full) {
    return address
  }

  return getEllipsisTxt(address, start ?? 10, 6)
}
