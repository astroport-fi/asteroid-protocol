import { GlobeAltIcon } from '@heroicons/react/24/outline'
import clsx from 'clsx'
import { useState } from 'react'
import { Collapse, Link } from 'react-daisyui'
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

  const [open, setOpen] = useState(false)

  return (
    <div className="flex flex-col p-5 pb-6 border-b border-b-neutral">
      <div className="flex items-center">
        <InscriptionImage
          src={collection.content_path!}
          isExplicit={collection.is_explicit}
          className="size-20 rounded-full"
        />
        <div
          className={clsx('flex flex-col ml-4 mt-1 h-full', {
            'justify-center': !hasSocials,
          })}
        >
          <h2 className="text-xl">{collection.name}</h2>
          {collection.metadata.description && (
            <Collapse.Title
              className="p-0 hover:cursor-pointer min-h-[initial]"
              onClick={() => setOpen(!open)}
            >
              <p className="text-ellipsis line-clamp-2">
                {collection.metadata.description}
              </p>
            </Collapse.Title>
          )}

          <div className="flex items-start mt-3 gap-2">
            {metadata.website && (
              <Link
                href="https://twitter.com/asteroidxyz"
                title={`${collection.name} website`}
                target="_blank"
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
        {stats && (
          <CollectionStatsComponent
            className="mx-8"
            stats={stats}
            royaltyPercentage={collection.royalty_percentage}
          />
        )}
      </div>
      <Collapse icon="arrow" open={open} className="mt-4">
        <Collapse.Content className="p-0 whitespace-pre-wrap">
          {collection.metadata.description}
        </Collapse.Content>
      </Collapse>
    </div>
  )
}
