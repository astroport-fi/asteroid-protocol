import { GlobeAltIcon } from '@heroicons/react/24/outline'
import clsx from 'clsx'
import { useState } from 'react'
import { Collapse, Link } from 'react-daisyui'
import { ClubStats } from '~/api/clubs'
import { CollectionDetail, CollectionStats } from '~/api/collection'
import { CollapseTextContent, CollapseTextTrigger } from './CollapseText'
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
  stats: CollectionStats | ClubStats | undefined
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
          className="size-20 shrink-0"
          imageClassName="rounded-full"
        />
        <div
          className={clsx('flex flex-col ml-4 mt-1 h-full', {
            'justify-center': !hasSocials,
          })}
        >
          <h2 className="text-xl">{collection.name}</h2>
          {collection.metadata.description && (
            <CollapseTextTrigger
              onToggle={() => setOpen(!open)}
              title={collection.metadata.description}
            />
          )}

          <div className="flex items-start mt-3 gap-2">
            {metadata.website && (
              <Link
                href={metadata.website}
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
      <Collapse open={open} className="rounded-none">
        <CollapseTextContent>
          {collection.metadata.description}
        </CollapseTextContent>
      </Collapse>
    </div>
  )
}
