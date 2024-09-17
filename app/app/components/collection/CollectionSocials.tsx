import { GlobeAltIcon, PencilSquareIcon } from '@heroicons/react/24/outline'
import { Link } from '@remix-run/react'
import { Link as DaisyLink } from 'react-daisyui'
import { CollectionDetail } from '~/api/collection'
import Discord from '~/components/icons/discord'
import Telegram from '~/components/icons/telegram'
import Twitter from '~/components/icons/twitter'
import useAddress from '~/hooks/wallet/useAddress'

export default function CollectionSocials({
  collection,
  isLaunchpad = false,
}: {
  collection: CollectionDetail
  isLaunchpad?: boolean
}) {
  const { metadata, creator } = collection
  const address = useAddress()

  return (
    <div className="flex items-start justify-center xl:justify-start mt-3 gap-2">
      {metadata.website && (
        <DaisyLink
          href={metadata.website}
          title={`${collection.name} website`}
          target="_blank"
        >
          <GlobeAltIcon className="size-5" />
        </DaisyLink>
      )}
      {metadata.twitter && (
        <DaisyLink
          href={metadata.twitter}
          title={`${collection.name} on X`}
          target="_blank"
        >
          <Twitter className="size-5" />
        </DaisyLink>
      )}
      {metadata.telegram && (
        <DaisyLink
          href={metadata.telegram}
          title={`${collection.name} on Telegram`}
          target="_blank"
        >
          <Telegram className="size-5" />
        </DaisyLink>
      )}
      {metadata.discord && (
        <DaisyLink
          href={metadata.discord}
          title={`${collection.name} on Discord`}
          target="_blank"
        >
          <Discord className="size-5" />
        </DaisyLink>
      )}
      {creator === address && (
        <Link
          to={
            isLaunchpad
              ? `/app/edit/launch/${collection.symbol}`
              : `/app/edit/collection/${collection.symbol}`
          }
          title="Edit collection"
        >
          <PencilSquareIcon className="size-5" />
        </Link>
      )}
    </div>
  )
}
