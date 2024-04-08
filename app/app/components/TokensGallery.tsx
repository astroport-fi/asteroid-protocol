import { Link } from '@remix-run/react'
import { Token } from '~/api/token'
import { getDateAgo } from '~/utils/date'
import { getDecimalValue, getSupplyTitle } from '~/utils/number'
import Grid from './Grid'
import InscriptionImage from './InscriptionImage'
import logo from '../images/logo/a-white-on-transparent-250.png'

function TokenComponent({ token }: { token: Token }) {
  return (
    <Link
      className="flex flex-col justify-between bg-base-200 rounded-xl group"
      to={`/app/token/${token.ticker}`}
    >
      <InscriptionImage
        containerClassName="rounded-t-xl h-full w-full"
        src={token.content_path ?? logo}
      />
      <div className="flex flex-col bg-base-300 rounded-b-xl p-4">
        <strong>{token.name}</strong>
        <span>
          Max Supply:{' '}
          {getSupplyTitle(getDecimalValue(token.max_supply, token.decimals))}
        </span>
        <span>{getDateAgo(token.date_created)}</span>
      </div>
    </Link>
  )
}

export function Tokens({ tokens }: { tokens: Token[] }) {
  return (
    <Grid>
      {tokens.map((token) => (
        <TokenComponent key={token.id} token={token} />
      ))}
    </Grid>
  )
}
