import { LoaderFunctionArgs } from '@remix-run/cloudflare'
import { json, useLoaderData } from '@remix-run/react'
import clsx from 'clsx'
import { formatRelative } from 'date-fns'
import { useState } from 'react'
import { Badge, Progress } from 'react-daisyui'
import { twMerge } from 'tailwind-merge'
import { AsteroidClient } from '~/api/client'
import { Stage } from '~/api/launchpad'
import DecimalText from '~/components/DecimalText'
import InscriptionImage from '~/components/InscriptionImage'
import MintInscription from '~/components/MintInscription'
import PercentageText from '~/components/PercentageText'
import CollectionSocials from '~/components/collection/CollectionSocials'
import { getSupplyTitle } from '~/utils/number'

export async function loader({ context, params }: LoaderFunctionArgs) {
  if (!params.symbol) {
    throw new Response(null, {
      status: 404,
      statusText: 'Not Found',
    })
  }

  const asteroidClient = new AsteroidClient(context.cloudflare.env.ASTEROID_API)
  const launch = await asteroidClient.getLaunch(params.symbol)

  if (!launch) {
    throw new Response(null, {
      status: 404,
      statusText: 'Not Found',
    })
  }

  return json(launch)
}

function StageBox({ stage }: { stage: Stage }) {
  const now = new Date()
  const isEnded = stage.finish_date && new Date(stage.finish_date) < now
  const isActive =
    (!stage.start_date || new Date(stage.start_date) < now) && !isEnded

  let title = stage.name
  // @todo add public/whitelist type to stage
  const isWhitelisted = stage.per_user_limit === 1
  if (!title) {
    if (isWhitelisted) {
      title = 'Whitelist'
    } else {
      title = 'Public'
    }
  }

  return (
    <div
      className={clsx(
        'flex justify-between items-center w-full p-4 rounded-xl',
        {
          'border border-primary': isActive,
        },
      )}
    >
      <div className="flex flex-col">
        {title}
        <DecimalText value={stage.price} suffix=" ATOM" className="mt-2" />
      </div>
      <div>
        {isEnded ? (
          <span className="text-primary">Ended</span>
        ) : isActive ? (
          stage.finish_date ? (
            <span>
              Ends {formatRelative(new Date(stage.finish_date!), new Date())}
            </span>
          ) : (
            <span className="text-success">Indefinite</span>
          )
        ) : (
          <span>
            Starts {formatRelative(new Date(stage.start_date!), new Date())}
          </span>
        )}
      </div>
    </div>
  )
}

export default function LaunchpadDetailPage() {
  const launchpad = useLoaderData<typeof loader>()
  const { collection } = launchpad
  const [collapsed, isCollapsed] = useState(true)

  return (
    <div className="flex flex-col lg:flex-row w-full max-w-[1920px] gap-8">
      <InscriptionImage
        src={collection.content_path!}
        isExplicit={collection.is_explicit}
        imageClassName="rounded-xl object-contain"
        className="max-w-3xl w-full"
        containerClassName="flex lg:flex-1 items-start"
      />

      <div className="rounded-b-xl flex flex-1 flex-col items-start">
        <div className="flex flex-col">
          <h2 className="text-3xl">{collection.name}</h2>
        </div>
        <CollectionSocials collection={collection} />
        <div className="btn btn-neutral btn-sm cursor-auto mt-4">
          Total supply
          <Badge>{getSupplyTitle(launchpad.max_supply)}</Badge>
        </div>

        <p
          className={twMerge(
            clsx(
              'transition-all overflow-hidden ease-in-out delay-50 duration-500 text-ellipsis mt-4 cursor-pointer max-h-[100rem]',
              {
                'max-h-24 line-clamp-4': collapsed,
              },
            ),
          )}
          onClick={() => isCollapsed(!collapsed)}
          role="presentation"
        >
          {collection.metadata.description}
        </p>

        <div className="flex w-full justify-between mt-8">
          {launchpad.stages.map((stage) => (
            <StageBox key={stage.id} stage={stage} />
          ))}
        </div>

        <MintInscription launchpad={launchpad} className="mt-4 w-full" />

        {launchpad.max_supply && (
          <div className="flex flex-col w-full">
            <Progress
              color="primary"
              className="mt-2"
              value={(launchpad.minted_supply / launchpad.max_supply) * 100}
            />
            <div className="flex justify-between mt-2 text-sm">
              <span>Minted</span>
              <span>
                <PercentageText
                  value={launchpad.minted_supply / launchpad.max_supply}
                />
                <span className="text-header-content ml-1 text-xs">
                  ({launchpad.minted_supply} / {launchpad.max_supply})
                </span>
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
