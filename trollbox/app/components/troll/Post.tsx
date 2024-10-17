import { Link } from '@remix-run/react'
import { ChatBubble } from 'react-daisyui'
import { TrollPost } from '~/api/trollbox'
import useAddress from '~/hooks/wallet/useAddress'
import { shortAddress } from '~/utils/string'
import DecimalText from '../DecimalText'
import CollectPost from './CollectPost'

export default function Post({ post }: { post: TrollPost }) {
  const mintedAmount =
    post.launchpad?.mint_reservations_aggregate?.aggregate?.max?.token_id ?? 0
  const price = 1000 * (mintedAmount + 1)
  const address = useAddress()
  const isOwner = address === post.creator

  return (
    <div className="flex items-center p-4">
      <ChatBubble>
        <ChatBubble.Avatar
          letters={shortAddress(post.creator)}
          color="neutral"
          shape="circle"
          size="sm"
        />
        <ChatBubble.Message
          color={isOwner ? 'accent' : undefined}
          className="whitespace-pre-wrap break-words"
        >
          <Link to={`/post/${post.id}`}>{post.text}</Link>
        </ChatBubble.Message>
        <ChatBubble.Footer className="flex items-center opacity-100">
          <CollectPost trollPost={post} price={price} />
          <span className="mx-2">•</span>
          <div className="flex flex-col lg:flex-row">
            <DecimalText value={price} decimalScale={6} />
            <span className="lg:ml-1">ATOM</span>
          </div>
          <span className="mx-2">•</span>
          <div className="flex flex-col lg:flex-row">
            <span>{mintedAmount} / 100</span>
            <span className="lg:ml-1">minted</span>
          </div>
        </ChatBubble.Footer>
      </ChatBubble>
    </div>
  )
}
