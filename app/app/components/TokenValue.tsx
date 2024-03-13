import { NumericFormat } from 'react-number-format'
import { useRootContext } from '~/context/root'
import { getDecimalValue } from '~/utils/number'

export default function TokenValue({
  amount,
  decimals,
  price,
  ticker,
}: {
  amount: number
  decimals: number
  price: number
  ticker: string
}) {
  const {
    status: { baseTokenUsd },
  } = useRootContext()

  const tokenAmount = getDecimalValue(amount, decimals)
  const dollarsAmount =
    (((amount / Math.pow(10, decimals)) * price) / Math.pow(10, decimals)) *
    baseTokenUsd

  return (
    <span className="flex flex-col">
      <NumericFormat
        className="font-mono"
        displayType="text"
        thousandSeparator
        decimalScale={tokenAmount < 1 ? 6 : 2}
        suffix={` ${ticker}`}
        value={tokenAmount}
      />
      <NumericFormat
        displayType="text"
        className="font-mono text-sm text-header-content font-light mt-0.5"
        thousandSeparator
        prefix="$"
        decimalScale={dollarsAmount < 1 ? 6 : 2}
        value={dollarsAmount}
      />
    </span>
  )
}
