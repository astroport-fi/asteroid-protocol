import { getEllipsisTxt } from '~/utils/string'

export default function Address({ address }: { address: string }) {
  return getEllipsisTxt(address, 10, 6)
}
