import { useParams } from '@remix-run/react'

export default function MarketPage() {
  const { ticker } = useParams()
  return <div>Market: {ticker}</div>
}
