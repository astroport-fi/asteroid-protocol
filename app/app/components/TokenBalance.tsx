import { twMerge } from 'tailwind-merge'
import { Token } from '~/api/token'
import { useTokenFactoryBalance } from '~/hooks/useTokenFactory'
import { useNeutronAddress } from '~/hooks/wallet/useAddress'
import TokenValue from './TokenValue'

interface Props {
  token: Token
  amount?: number
  className?: string
}

export default function TokenBalance({ token, amount, className }: Props) {
  const neutronAddress = useNeutronAddress()
  const balance = useTokenFactoryBalance(token.ticker, neutronAddress)

  return (
    <div className={twMerge('flex flex-col', className)}>
      <strong>Your balance</strong>
      <TokenValue
        amount={amount ?? 0}
        decimals={token.decimals}
        price={token.last_price_base}
        ticker={token.ticker}
      />

      <strong className="mt-4">Your bridged balance</strong>
      <TokenValue
        amount={parseInt(balance?.amount ?? '0')}
        decimals={token.decimals}
        price={token.last_price_base}
        ticker={token.ticker}
      />
    </div>
  )
}
