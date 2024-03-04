import useStargazeName from '~/hooks/useStargazeName'
import { getEllipsisTxt } from '~/utils/string'

interface Props {
  address: string
  full?: boolean
  start?: number
}

export default function Address({ address, full, start }: Props) {
  const { name: stargazeName } = useStargazeName(address)

  if (stargazeName) {
    return stargazeName
  }

  if (full) {
    return address
  }

  return getEllipsisTxt(address, start ?? 10, 6)
}
