import {
  GlobeAltIcon,
  InformationCircleIcon,
  PencilSquareIcon,
} from '@heroicons/react/24/outline'
import { Link } from '@remix-run/react'
import clsx from 'clsx'
import { useMemo, useState } from 'react'
import { Collapse, Link as DaisyLink } from 'react-daisyui'
import { ClubStats } from '~/api/clubs'
import { CollectionDetail, CollectionStats } from '~/api/collection'
import useAddress from '~/hooks/useAddress'
import { usesAsteroidSocialLinks } from '~/utils/collection'
import { CollapseTextContent, CollapseTextTrigger } from './CollapseText'
import CollectionStatsComponent from './CollectionStats'
import InscriptionImage from './InscriptionImage'
import { NotAffiliatedWarning } from './alerts/NotAffiliatedAlert'
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
  const address = useAddress()
  const { metadata, creator } = collection
  const hasSocials =
    metadata.twitter ||
    metadata.telegram ||
    metadata.discord ||
    metadata.website
  const notAffiliatedWarning = useMemo(() => {
    return usesAsteroidSocialLinks(collection.symbol, metadata)
  }, [collection.symbol, metadata])

  const [open, setOpen] = useState(false)

  return (
    <div className="flex flex-col p-5 pb-6 border-b border-b-neutral">
      <div className="flex items-center flex-col xl:flex-row">
        <InscriptionImage
          src={collection.content_path!}
          isExplicit={collection.is_explicit}
          className="size-20 shrink-0"
          imageClassName="rounded-full"
        />
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
                to={`/app/edit/collection/${collection.symbol}`}
                title="Edit collection"
              >
                <PencilSquareIcon className="size-5" />
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
      {notAffiliatedWarning && <NotAffiliatedWarning className="mt-4" />}

      <Collapse open={open} className="rounded-none">
        <CollapseTextContent>
          {collection.metadata.description}
        </CollapseTextContent>
      </Collapse>
    </div>
  )
}
