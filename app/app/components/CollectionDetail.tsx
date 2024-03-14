import { GlobeAltIcon } from '@heroicons/react/24/outline'
import clsx from 'clsx'
import { Link } from 'react-daisyui'
import { CollectionDetail } from '~/api/collection'
import { CollectionStats } from '~/api/common'
import CollectionStatsComponent from './CollectionStats'
import InscriptionImage from './InscriptionImage'
import Discord from './icons/discord'
import Telegram from './icons/telegram'
import Twitter from './icons/twitter'

export default function CollectionDetailComponent({
  collection,
  stats,
}: {
  collection: CollectionDetail
  stats: CollectionStats | undefined
}) {
  const { metadata } = collection
  const hasSocials =
    metadata.twitter ||
    metadata.telegram ||
    metadata.discord ||
    metadata.website

  return (
    <div className="flex p-5 pb-6  border-b border-b-neutral items-center">
      <InscriptionImage
        src={collection.content_path!}
        isExplicit={collection.is_explicit}
        className="size-20 rounded-full"
      />
      <div
        className={clsx('flex flex-col ml-4 mt-1 h-full flex-shrink-0', {
          'justify-center': !hasSocials,
        })}
      >
        <h2 className="text-xl">{collection.name} collection</h2>
        <div className="flex mt-3">
          {metadata.website && (
            <Link
              href="https://twitter.com/asteroidxyz"
              title={`${collection.name} website`}
              target="_blank"
              className="ml-3"
            >
              <GlobeAltIcon className="size-5" />
            </Link>
          )}
          {metadata.twitter && (
            <Link
              href={metadata.twitter}
              title={`${collection.name} on X`}
              target="_blank"
            >
              <Twitter className="size-5" />
            </Link>
          )}
          {metadata.telegram && (
            <Link
              href={metadata.telegram}
              title={`${collection.name} on Telegram`}
              target="_blank"
            >
              <Telegram className="size-5" />
            </Link>
          )}
          {metadata.discord && (
            <Link
              href={metadata.discord}
              title={`${collection.name} on Discord`}
              target="_blank"
            >
              <Discord className="size-5" />
            </Link>
          )}
        </div>
      </div>
      {stats && <CollectionStatsComponent stats={stats} />}
    </div>
  )
}
