import { Link } from '@remix-run/react'
import { formatDistance } from 'date-fns'
import { ChatBubble } from 'react-daisyui'
import { TrollPost } from '~/api/trollbox'
import useStargazeName from '~/hooks/useStargazeName'
import useAddress from '~/hooks/wallet/useAddress'
import { getDateFromUTCString } from '~/utils/date'
import { shortAddress } from '~/utils/string'
import DecimalText from '../DecimalText'
import CollectPost from './CollectPost'

export default function Post({ post }: { post: TrollPost }) {
  const mintedAmount =
    post.launchpad?.mint_reservations_aggregate?.aggregate?.max?.token_id ?? 0
  const price = 1000 * (mintedAmount + 1)
  const address = useAddress()
  const { name: stargazeName } = useStargazeName(post.creator)
  const isOwner = address === post.creator

  return (
    <div className="flex items-center p-4">
      <ChatBubble>
        <ChatBubble.Avatar
          letters={shortAddress(post.creator)}
          color="neutral"
          shape="circle"
          className="flex-shrink-0"
          size="sm"
          border
          borderColor="primary"
        />
        <ChatBubble.Header>
          <span>{stargazeName}</span>
          <ChatBubble.Time className="ml-1">
            {formatDistance(
              getDateFromUTCString(post.date_created),
              new Date(),
              {
                addSuffix: true,
              },
            )}
          </ChatBubble.Time>
        </ChatBubble.Header>
        <ChatBubble.Message
          color={isOwner ? 'accent' : undefined}
          className="whitespace-pre-wrap break-words mt-1"
        >
          <Link to={`/post/${post.id}`}>{post.text}</Link>
        </ChatBubble.Message>
        <ChatBubble.Footer className="flex items-center opacity-100 mt-2">
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
