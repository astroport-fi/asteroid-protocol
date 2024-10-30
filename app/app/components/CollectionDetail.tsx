import { InformationCircleIcon } from '@heroicons/react/24/outline'
import clsx from 'clsx'
import { useMemo, useState } from 'react'
import { Collapse, Link as DaisyLink } from 'react-daisyui'
import { ClubStats } from '~/api/clubs'
import { CollectionDetail, CollectionStats } from '~/api/collection'
import { usesAsteroidSocialLinks } from '~/utils/collection'
import { CollapseTextContent, CollapseTextTrigger } from './CollapseText'
import CollectionStatsComponent from './CollectionStats'
import InscriptionImage from './InscriptionImage'
import { NotAffiliatedWarning } from './alerts/NotAffiliatedAlert'
import CollectionSocials from './collection/CollectionSocials'

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
  const notAffiliatedWarning = useMemo(() => {
    return usesAsteroidSocialLinks(collection.symbol, metadata)
  }, [collection.symbol, metadata])

  const [open, setOpen] = useState(false)
  const isTrollbox = collection.symbol.startsWith('TROLL:')

  return (
    <div className="flex flex-col p-5 pb-6 border-b border-b-neutral">
      <div className="flex items-center flex-col xl:flex-row">
        {isTrollbox ? (
          <span className="flex flex-shrink-0 items-center justify-center p-2 size-20 bg-no-repeat bg-cover bg-center rounded-full bg-base-200">
            TROLLBOX
          </span>
        ) : (
          <InscriptionImage
            src={collection.content_path!}
            isExplicit={collection.is_explicit}
            className="size-20 shrink-0"
            imageClassName="rounded-full"
          />
        )}

        <div
          className={clsx(
            'flex flex-col xl:ml-4 mt-2 xl:mt-1 h-full items-center xl:items-start',
            {
              'justify-center': !hasSocials,
            },
          )}
        >
          <h2 className="text-xl flex items-center">
            {collection.name}
            {collection.metadata.description && (
              <DaisyLink
                onClick={() => setOpen(!open)}
                color="ghost"
                className="lg:hidden ml-2"
              >
                <InformationCircleIcon className="size-5" />
              </DaisyLink>
            )}
          </h2>
          {collection.metadata.description && (
            <div className="hidden lg:flex">
              <CollapseTextTrigger
                onToggle={() => setOpen(!open)}
                title={collection.metadata.description}
              />
            </div>
          )}

          <CollectionSocials collection={collection} />
        </div>
        {stats && (
          <CollectionStatsComponent
            className="mx-8"
            stats={stats}
            royaltyPercentage={collection.royalty_percentage}
          />
        )}
      </div>
      {notAffiliatedWarning && <NotAffiliatedWarning className="mt-4" />}

      <Collapse open={open} className="rounded-none">
        <CollapseTextContent>
          {collection.metadata.description}
        </CollapseTextContent>
      </Collapse>
    </div>
  )
}
