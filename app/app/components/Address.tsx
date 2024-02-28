import { getEllipsisTxt } from '~/utils/string'

interface Props {
  address: string
  full?: boolean
}

export default function Address({ address, full }: Props) {
  if (full) {
    return address
  }

  return getEllipsisTxt(address, 10, 6)
}
