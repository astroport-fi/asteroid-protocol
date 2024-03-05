import { twMerge } from 'tailwind-merge'
import { Token } from '~/api/token'
import TokenValue from './TokenValue'

interface Props {
  token: Token
  amount?: number
  className?: string
}

export default function TokenBalance({ token, amount, className }: Props) {
  return (
    <div className={twMerge('flex flex-col', className)}>
      <strong>Your balance</strong>
      <TokenValue
        amount={amount ?? 0}
        decimals={token.decimals}
        price={token.last_price_base}
        ticker={token.ticker}
      />
    </div>
  )
}
