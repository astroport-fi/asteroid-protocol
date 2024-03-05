import { NumericFormat } from 'react-number-format'
import { useRootContext } from '~/context/root'

export default function AtomValue({ value }: { value: number }) {
  const {
    status: { baseTokenUsd, baseToken },
  } = useRootContext()
  return (
    <span className="font-mono">
      {value / 10e5} {baseToken} (
      <NumericFormat
        displayType="text"
        thousandSeparator
        prefix="$"
        decimalScale={6}
        value={(value * baseTokenUsd) / 10e5}
      />
      )
    </span>
  )
}
