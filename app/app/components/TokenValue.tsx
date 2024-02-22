import { NumericFormat } from 'react-number-format'
import { useRootContext } from '~/context/root'
import { getDecimalValue } from '~/utils/number'

export default function TokenValue({
  amount,
  decimals,
  price,
  ticker,
  className,
}: {
  amount: number
  decimals: number
  price: number
  ticker: string
  className?: string
}) {
  const {
    status: { baseTokenUsd },
  } = useRootContext()

  return (
    <span className={className}>
      <NumericFormat
        className="mr-1"
        displayType="text"
        thousandSeparator
        decimalScale={decimals}
        suffix={` ${ticker}`}
        value={getDecimalValue(amount, decimals)}
      />
      (
      <NumericFormat
        displayType="text"
        thousandSeparator
        prefix="$"
        decimalScale={decimals}
        value={
          (((amount / Math.pow(10, decimals)) * price) /
            Math.pow(10, decimals)) *
          baseTokenUsd
        }
      />
      )
    </span>
  )
}
