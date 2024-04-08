import { Token } from '~/api/token'
import InscriptionImage from './InscriptionImage'

export function TokenCell({
  token,
}: {
  token: Pick<Token, 'content_path' | 'name' | 'ticker'>
}) {
  return (
    <span className="flex items-center">
      <InscriptionImage
        mime="image/png"
        src={token.content_path!}
        // isExplicit={token.is_explicit} @todo
        className="size-6"
        imageClassName="rounded-xl"
      />
      <span className="items-baseline ml-1.5">
        <span className="text-base">{token.name}</span>
        <span className="text-sm text-header-content font-light ml-1">
          {token.ticker}
        </span>
      </span>
    </span>
  )
}
