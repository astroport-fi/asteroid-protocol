import { format } from 'date-fns'
import { PropsWithChildren } from 'react'
import { NumericFormat } from 'react-number-format'
import { TokenDetail, isTokenLaunched } from '~/api/token'
import { useRootContext } from '~/context/root'
import { DATETIME_FORMAT } from '~/utils/date'
import { getDecimalValue, getSupplyTitle } from '~/utils/number'
import AtomValue from './AtomValue'
import PercentageText from './PercentageText'

function Row({ children }: PropsWithChildren) {
  return <div className="flex flex-row w-full mt-4">{children}</div>
}

function Column({ children, title }: PropsWithChildren<{ title: string }>) {
  return (
    <div className="flex flex-col flex-1">
      <strong className="mb-1">{title}</strong>
      {children}
    </div>
  )
}

export default function Tokenomics({
  token,
  showPrice,
}: {
  token: TokenDetail
  showPrice?: boolean
}) {
  const {
    status: { baseTokenUsd },
  } = useRootContext()
  return (
    <div>
      <Row>
        <Column title="Max supply">
          <span className="font-mono">
            {getSupplyTitle(getDecimalValue(token.max_supply, token.decimals))}
          </span>
        </Column>
        <Column title="Circulating">
          <span className="font-mono">
            {getSupplyTitle(
              getDecimalValue(token.circulating_supply, token.decimals),
            )}{' '}
            (
            <PercentageText
              value={token.circulating_supply / token.max_supply}
            />
            )
          </span>
        </Column>
      </Row>
      {showPrice && (
        <Row>
          <Column title="Price">
            <AtomValue horizontal value={token.last_price_base} />
          </Column>
          <Column title="Market cap">
            <NumericFormat
              className="font-mono"
              displayType="text"
              thousandSeparator
              decimalScale={2}
              prefix="$"
              value={
                getDecimalValue(token.circulating_supply, token.decimals) *
                (baseTokenUsd *
                  getDecimalValue(token.last_price_base, token.decimals))
              }
            />
          </Column>
        </Row>
      )}
      <Row>
        <Column title="Limit per mint">
          <NumericFormat
            className="font-mono"
            displayType="text"
            thousandSeparator
            value={getDecimalValue(token.per_mint_limit, token.decimals)}
          />
        </Column>
        <Column title={isTokenLaunched(token) ? 'Launched at' : 'Launching'}>
          <span>{format(token.launch_timestamp * 1000, DATETIME_FORMAT)}</span>
        </Column>
      </Row>
    </div>
  )
}
