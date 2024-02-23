import { Link } from '@remix-run/react'
import { Token } from '~/services/asteroid'
import { getDateAgo } from '~/utils/date'
import { getDecimalValue, getSupplyTitle } from '~/utils/number'
import logo from '../images/logo/a-white-on-transparent-250.png'

function TokenLogo({
  isExplicit,
  src,
}: {
  // @todo handle explicit
  isExplicit?: boolean
  src?: string
}) {
  return (
    <img
      src={src ?? logo}
      alt=""
      className="w-full h-full rounded-t-xl object-cover"
    />
  )
}

function TokenComponent({ token }: { token: Token }) {
  // @todo handle different content from image
  return (
    <Link
      className="flex flex-col justify-between bg-base-200 rounded-xl"
      to={`/app/token/${token.ticker}`}
    >
      <TokenLogo src={token.content_path} isExplicit={false} />
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
    <div className="grid grid-cols-6 gap-4">
      {tokens.map((token) => (
        <TokenComponent key={token.id} token={token} />
      ))}
    </div>
  )
}
