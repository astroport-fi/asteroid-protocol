import { LoaderFunctionArgs, json } from '@remix-run/cloudflare'
import { Link, useLoaderData } from '@remix-run/react'
import { formatRelative } from 'date-fns'
import { PropsWithChildren } from 'react'
import { Divider } from 'react-daisyui'
import { AsteroidClient } from '~/api/client'
import { LaunchpadItem, getActiveOrFirstStageItem } from '~/api/launchpad'
import { UploadApi } from '~/api/upload'
import DecimalText from '~/components/DecimalText'
import Grid from '~/components/Grid'
import InscriptionImage from '~/components/InscriptionImage'
import PercentageText from '~/components/PercentageText'
import { getDateFromUTCString } from '~/utils/date'
import { getSupplyTitle } from '~/utils/number'

export async function loader({ context }: LoaderFunctionArgs) {
  const asteroidClient = new AsteroidClient(context.cloudflare.env.ASTEROID_API)
  const uploadClient = new UploadApi(context.cloudflare.env.UPLOAD_API)

  let launches = await asteroidClient.getActiveLaunches()
  const stats = await uploadClient.launchpads()
  const statsByHash = Object.fromEntries(
    stats.map((stat) => [stat.launchpad_hash, stat]),
  )

  launches = launches.filter((launch) => {
    if (launch.max_supply && launch.max_supply === launch.minted_supply) {
      return false
    }
    const stat = statsByHash[launch.transaction.hash]
    if (!stat) {
      return false
    }
    return stat.uploaded >= launch.max_supply
  })

  const pastLaunches = await asteroidClient.getPastLaunches()

  return json({
    launches,
    pastLaunches,
  })
}

function BoxValue({ title, children }: PropsWithChildren<{ title: string }>) {
  return (
    <div className="flex flex-col items-start">
      <span className="uppercase text-sm text-header-content">{title}</span>
      <span className="text-base">{children}</span>
    </div>
  )
}

export function LaunchBox({ launchpad }: { launchpad: LaunchpadItem }) {
  const { collection } = launchpad

  const stage = getActiveOrFirstStageItem(launchpad.stages)

  const isMintedOut =
    launchpad.max_supply && launchpad.max_supply === launchpad.minted_supply

  const isEnded =
    isMintedOut ||
    (launchpad.finish_date &&
      getDateFromUTCString(launchpad.finish_date!) < new Date())

  const isActive =
    !isEnded &&
    (!launchpad.start_date ||
      getDateFromUTCString(launchpad.start_date) < new Date())

  return (
    <Link
      className="carousel-item flex flex-col bg-base-200 rounded-xl group mr-4"
      to={`/app/launchpad/${collection.symbol}`}
    >
      <InscriptionImage
        src={collection.content_path!}
        isExplicit={collection.is_explicit}
        className="h-60"
        containerClassName="rounded-t-xl"
      />

      <div className="bg-base-300 rounded-b-xl flex flex-col py-4">
        <div className="flex flex-col px-4">
          <strong className="text-nowrap whitespace-nowrap overflow-hidden text-ellipsis">
            {collection.name}
          </strong>
        </div>
        <Divider className="my-1" />
        <div className="flex justify-between mx-4 gap-4 flex-shrink-0">
          <BoxValue title="Price">
            <DecimalText value={stage.price} suffix=" ATOM" />
          </BoxValue>
          <BoxValue title="Items">
            {getSupplyTitle(launchpad.max_supply)}
          </BoxValue>
          <BoxValue title="Minted">
            {launchpad.max_supply > 0 ? (
              <PercentageText
                value={launchpad.minted_supply / launchpad.max_supply}
              />
            ) : (
              `${launchpad.minted_supply} / ∞`
            )}
          </BoxValue>
        </div>
        <Divider className="my-1" />
        <div className="flex flex-col items-center">
          <span>
            {isEnded ? (
              <span className="text-info">Ended</span>
            ) : isActive ? (
              <span className="text-success">Live</span>
            ) : (
              <span>
                Starts{' '}
                {formatRelative(
                  getDateFromUTCString(launchpad.start_date!),
                  new Date(),
                )}
              </span>
            )}
          </span>
        </div>
      </div>
    </Link>
  )
}

export default function LaunchpadPage() {
  const data = useLoaderData<typeof loader>()

  return (
    <div className="flex flex-col w-full max-w-[1920px]">
      <h3 className="text-xl text-white mt-12">Live & Upcoming launches</h3>

      <Grid className="mt-4 grid-cols-fill-64">
        {data.launches.map((launch) => (
          <LaunchBox key={launch.collection.id} launchpad={launch} />
        ))}
      </Grid>

      {data.pastLaunches.length > 0 && (
        <>
          <h3 className="text-xl text-white mt-12">Ended launches</h3>

          <Grid className="mt-4 grid-cols-fill-64">
            {data.pastLaunches.map((launch) => (
              <LaunchBox key={launch.collection.id} launchpad={launch} />
            ))}
          </Grid>
        </>
      )}
    </div>
  )
}
