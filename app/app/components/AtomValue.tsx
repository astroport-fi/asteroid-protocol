import clsx from 'clsx'
import { NumericFormat } from 'react-number-format'
import { useRootContext } from '~/context/root'

export default function AtomValue({
  value,
  horizontal,
  className,
  prefix,
}: {
  value: number
  horizontal?: boolean
  className?: string
  prefix?: string
}) {
  const {
    status: { baseTokenUsd, baseToken },
  } = useRootContext()

  const atomAmount = value / 10e5
  const dollarsAmount = (value * baseTokenUsd) / 10e5

  return (
    <span
      className={clsx('flex font-mono', className, {
        'flex-row items-baseline': horizontal,
        'flex-col': !horizontal,
      })}
    >
      <NumericFormat
        prefix={prefix}
        displayType="text"
        value={atomAmount}
        suffix={` ${baseToken}`}
        decimalScale={atomAmount < 1 ? 6 : 2}
      />
      <NumericFormat
        className={clsx('text-sm text-header-content font-light', {
          'ml-2': horizontal,
          'mt-0.5': !horizontal,
        })}
        displayType="text"
        thousandSeparator
        prefix="$"
        decimalScale={dollarsAmount < 1 ? 6 : 2}
        value={dollarsAmount}
      />
    </span>
  )
}
