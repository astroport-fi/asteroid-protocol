import { NumericFormat, NumericFormatProps } from 'react-number-format'
import { twMerge } from 'tailwind-merge'
import { getDecimalValue } from '~/utils/number'

export default function DecimalText({
  value,
  decimals = 6,
  ...props
}: {
  value: number
  decimals?: number
} & NumericFormatProps) {
  return (
    <NumericFormat
      className={twMerge('font-mono', props.className)}
      displayType="text"
      thousandSeparator
      value={getDecimalValue(value, decimals)}
      decimalScale={value < 1 ? decimals : 2}
      {...props}
    />
  )
}
