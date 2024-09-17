import { LockClosedIcon } from '@heroicons/react/20/solid'
import { LoaderFunctionArgs, MetaFunction } from '@remix-run/cloudflare'
import { json, useLoaderData } from '@remix-run/react'
import clsx from 'clsx'
import { format, formatRelative } from 'date-fns'
import { PropsWithChildren, useMemo, useState } from 'react'
import { Alert, Badge, Progress } from 'react-daisyui'
import { twMerge } from 'tailwind-merge'
import { AsteroidClient } from '~/api/client'
import { StageDetail, getActiveStageDetail } from '~/api/launchpad'
import { UploadApi } from '~/api/upload'
import DecimalText from '~/components/DecimalText'
import InscriptionImage from '~/components/InscriptionImage'
import MintInscription from '~/components/MintInscription'
import PercentageText from '~/components/PercentageText'
import CollectionSocials from '~/components/collection/CollectionSocials'
import { getAddress } from '~/utils/cookies'
import { DATETIME_FORMAT, getDateFromUTCString } from '~/utils/date'
import { collectionMeta } from '~/utils/meta'
import { getSupplyTitle } from '~/utils/number'

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  if (!data || !data.collection) {
    return []
  }

  return collectionMeta(data.collection)
}

export async function loader({ context, params, request }: LoaderFunctionArgs) {
  if (!params.symbol) {
    throw new Response(null, {
      status: 404,
      statusText: 'Not Found',
    })
  }

  const address = await getAddress(request)

  const asteroidClient = new AsteroidClient(context.cloudflare.env.ASTEROID_API)
  const launch = await asteroidClient.getLaunch(params.symbol, address)

  if (!launch) {
    throw new Response(null, {
      status: 404,
      statusText: 'Not Found',
    })
  }

  const uploadClient = new UploadApi(context.cloudflare.env.UPLOAD_API)
  const stats = await uploadClient.launchpad(launch.transaction.hash)

  return json({ launch, stats })
}

function CollapsibleDescription({
  children,
  className,
}: PropsWithChildren<{ className?: string }>) {
  const [collapsed, isCollapsed] = useState(true)

  return (
    <p
      className={twMerge(
        clsx(
          'transition-all overflow-hidden ease-in-out delay-50 duration-500 whitespace-pre-wrap text-ellipsis cursor-pointer max-h-[100rem]',
          className,
          {
            'max-h-24 line-clamp-4': collapsed,
          },
        ),
      )}
      onClick={() => isCollapsed(!collapsed)}
      role="presentation"
    >
      {children}
    </p>
  )
}

function StageBox({
  stage,
  selected,
}: {
  stage: StageDetail
  selected: boolean
}) {
  const now = new Date()
  const isEnded =
    stage.finish_date && getDateFromUTCString(stage.finish_date) < now
  const isActive =
    (!stage.start_date || getDateFromUTCString(stage.start_date) < now) &&
    !isEnded

  let title: React.ReactNode | undefined = stage.name
  if (!title) {
    if (stage.has_whitelist) {
      title = (
        <span className="flex items-center">
          <LockClosedIcon className="size-4" />{' '}
          <span className="ml-1">Whitelist</span>
        </span>
      )
    } else {
      title = 'Public'
    }
  }

  return (
    <div
      className={clsx(
        'flex justify-between items-center w-full p-4 rounded-xl border border-header-content mb-2',
        {
          'border-primary': selected,
        },
      )}
    >
      <div className="flex flex-col">
        {title}
        <DecimalText value={stage.price} suffix=" ATOM" className="mt-2" />
        <CollapsibleDescription className="mt-2">
          {stage.description}
        </CollapsibleDescription>
      </div>
      <div className="ml-4">
        {isEnded ? (
          <span className="text-primary">Ended</span>
        ) : isActive ? (
          stage.finish_date ? (
            <span>
              Ends{' '}
              {formatRelative(
                getDateFromUTCString(stage.finish_date!),
                new Date(),
              )}
            </span>
          ) : (
            <span className="text-success">Indefinite</span>
          )
        ) : (
          <span>
            Starts{' '}
            {formatRelative(
              getDateFromUTCString(stage.start_date!),
              new Date(),
            )}
          </span>
        )}
      </div>
    </div>
  )
}

export default function LaunchpadDetailPage() {
  const data = useLoaderData<typeof loader>()
  const { launch: launchpad, stats } = data
  const { collection } = launchpad

  const activeStage = useMemo(
    () => getActiveStageDetail(launchpad.stages),
    [launchpad.stages],
  )

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
          <Badge>
            {launchpad.max_supply ? getSupplyTitle(launchpad.max_supply) : '∞'}
          </Badge>
        </div>
        <div className="btn btn-neutral btn-sm cursor-auto mt-4">
          Reveal
          <Badge>
            {launchpad.reveal_immediately
              ? 'with each mint'
              : launchpad.reveal_date
                ? `at ${format(getDateFromUTCString(launchpad.reveal_date), DATETIME_FORMAT)}`
                : 'after fully minted out'}
          </Badge>
        </div>

        <CollapsibleDescription className="mt-4">
          {collection.metadata.description}
        </CollapsibleDescription>

        <div className="flex flex-col w-full justify-between mt-8">
          {launchpad.stages.map((stage) => (
            <StageBox
              key={stage.id}
              stage={stage}
              selected={activeStage?.id == stage.id}
            />
          ))}
        </div>

        {!launchpad.max_supply || stats.uploaded >= stats.total ? (
          <MintInscription
            launchpad={launchpad}
            className="mt-4 w-full"
            activeStage={activeStage}
          />
        ) : (
          <Alert className="border border-warning mt-4">
            Collection isn&apos;t ready to be minted yet
          </Alert>
        )}

        {launchpad.max_supply > 0 ? (
          <div className="flex flex-col w-full">
            <Progress
              color="primary"
              className="mt-2"
              value={launchpad.minted_supply / launchpad.max_supply}
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
        ) : (
          <div className="flex flex-col w-full">
            <Progress
              color="primary"
              className="mt-2"
              value={launchpad.minted_supply ? 0.3 : 0}
            />
            <div className="flex justify-between mt-2 text-sm">
              <span>Minted</span>
              <span>
                <span className="text-header-content ml-1 text-xs">
                  ({launchpad.minted_supply} / ∞)
                </span>
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
