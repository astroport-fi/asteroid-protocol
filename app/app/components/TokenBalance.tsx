import { NumericFormat } from 'react-number-format'
import { useRootContext } from '~/context/root'
import { getDecimalValue } from '~/utils/number'

export default function TokenBalance({
  amount,
  decimals,
  price,
}: {
  amount: number
  decimals: number
  price: number
}) {
  const {
    status: { baseTokenUsd },
  } = useRootContext()

  return (
    <span>
      <NumericFormat
        className="mr-1"
        displayType="text"
        thousandSeparator
        value={getDecimalValue(amount, decimals)}
      />
      (
      <NumericFormat
        displayType="text"
        thousandSeparator
        prefix="$"
        decimalScale={6}
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
