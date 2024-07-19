import { LoaderFunctionArgs } from '@remix-run/cloudflare'
import { json, useLoaderData } from '@remix-run/react'
import { formatRelative } from 'date-fns'
import { PropsWithChildren } from 'react'
import { AsteroidClient } from '~/api/client'
import DecimalText from '~/components/DecimalText'
import InscriptionImage from '~/components/InscriptionImage'
import PercentageText from '~/components/PercentageText'
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

function BoxValue({ title, children }: PropsWithChildren<{ title: string }>) {
  return (
    <div className="flex flex-col items-start">
      <span className="uppercase text-sm text-header-content">{title}</span>
      <span className="text-base">{children}</span>
    </div>
  )
}

export default function LaunchpadDetailPage() {
  const launchpad = useLoaderData<typeof loader>()

  const { collection } = launchpad

  // @todo get active stage
  const stage = launchpad.stages[0]

  const isActive =
    !launchpad.start_date || new Date(launchpad.start_date) < new Date()

  const isMintedOut =
    launchpad.max_supply && launchpad.max_supply === launchpad.minted_supply

  const isEnded =
    isMintedOut ||
    (launchpad.finish_date && new Date(launchpad.finish_date!) < new Date())

  return (
    <div className="flex flex-row w-full max-w-[1920px]">
      <InscriptionImage
        src={collection.content_path!}
        isExplicit={collection.is_explicit}
        imageClassName="rounded-xl object-contain"
        className="max-w-3xl w-full"
        containerClassName="flex flex-1"
      />

      <div className="rounded-b-xl flex flex-1 flex-col">
        <div className="flex flex-col">
          <h2 className="text-3xl">{collection.name}</h2>
        </div>
        <div className="flex justify-between mt-8">
          <BoxValue title="Price">
            <DecimalText value={stage.price} suffix=" ATOM" />
          </BoxValue>
          <BoxValue title="Items">
            {getSupplyTitle(launchpad.max_supply)}
          </BoxValue>
          <BoxValue title="Minted">
            <PercentageText
              value={launchpad.minted_supply / launchpad.max_supply}
            />
          </BoxValue>
        </div>
        <div className="flex flex-col items-center mt-8">
          <span className="text-lg">
            {isActive ? (
              <span className="text-success">Live</span>
            ) : isEnded ? (
              <span className="text-info">Ended</span>
            ) : (
              <span>
                Starts{' '}
                {formatRelative(new Date(launchpad.start_date!), new Date())}
              </span>
            )}
          </span>
        </div>
      </div>
    </div>
  )
}
