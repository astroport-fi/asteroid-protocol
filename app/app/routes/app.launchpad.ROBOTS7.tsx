import { NFTMetadata } from '@asteroid-protocol/sdk'
import { LoaderFunctionArgs, MetaFunction } from '@remix-run/cloudflare'
import { json, useLoaderData } from '@remix-run/react'
import clsx from 'clsx'
import { format } from 'date-fns'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Alert, Badge, Checkbox, Input, Progress } from 'react-daisyui'
import { useForm } from 'react-hook-form'
import { Rnd } from 'react-rnd'
import { AsteroidClient } from '~/api/client'
import { getActiveStageDetail } from '~/api/launchpad'
import { UploadApi } from '~/api/upload'
import CollapsibleDescription from '~/components/CollapsibleDescription'
import MintInscription from '~/components/MintInscription'
import PercentageText from '~/components/PercentageText'
import CollectionSocials from '~/components/collection/CollectionSocials'
import LaunchpadInscriptionSelect from '~/components/dialogs/LaunchpadInscriptionSelect'
import Label from '~/components/form/Label'
import { ContentInput } from '~/components/inscription-form/Inputs'
import { useRootContext } from '~/context/root'
import useUploadApi from '~/hooks/api/useUploadApi'
import useInscriptionUrl from '~/hooks/uploader/useInscriptionUrl'
import { getAddress } from '~/utils/cookies'
import { DATETIME_FORMAT, getDateFromUTCString } from '~/utils/date'
import { collectionMeta } from '~/utils/meta'
import { getSupplyTitle } from '~/utils/number'
import { getFileExtension } from '~/utils/string'

const SYMBOL = 'ROBOTS7'

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  if (!data || !data.launch.collection) {
    return []
  }

  return collectionMeta(data.launch.collection)
}

export async function loader({ context, request }: LoaderFunctionArgs) {
  const address = await getAddress(request)

  const asteroidClient = new AsteroidClient(context.cloudflare.env.ASTEROID_API)
  const launch = await asteroidClient.getLaunch(SYMBOL, address)

  if (!launch) {
    throw new Response(null, {
      status: 404,
      statusText: 'Not Found',
    })
  }

  const uploadClient = new UploadApi(context.cloudflare.env.UPLOAD_API)
  const stats = await uploadClient.launchpad(launch.transaction.hash)
  const inscriptionsRes = await uploadClient.getPublicInscriptions(
    launch.transaction.hash,
  )
  if (!inscriptionsRes) {
    throw new Response(null, {
      status: 404,
      statusText: 'Not Found',
    })
  }

  return json({
    launch,
    stats,
    inscriptions: inscriptionsRes.inscriptions,
    folder: inscriptionsRes.folder,
  })
}

type FormData = {
  content: File[]
  oath: boolean
  name: string
}

export default function LaunchpadDetailPage() {
  const data = useLoaderData<typeof loader>()
  const { launch: launchpad } = data
  const { collection } = launchpad
  const { assetsUrl } = useRootContext()

  // preview
  const [preview, setPreview] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)

  // cat
  const overlayWidth = 485.2
  const overlayHeight = 403
  const ratio = overlayWidth / overlayHeight
  const minWidth = 100
  const minHeight = minWidth / ratio

  const [size, updateSize] = useState({ width: minWidth, height: minHeight })
  const [position, updatePosition] = useState({ x: 20, y: 20 })

  const parentRef = useRef<HTMLDivElement>(null)
  const [parentSize, updateParentSize] = useState({ width: 0, height: 0 })

  useEffect(() => {
    const updateDimensions = () => {
      if (parentRef.current) {
        const { clientWidth, clientHeight } = parentRef.current
        updateParentSize({ width: clientWidth, height: clientHeight })
      }
    }

    const resizeObserver = new ResizeObserver(updateDimensions)

    const elm = parentRef.current
    if (elm) {
      resizeObserver.observe(elm)
      // Initial update
      updateDimensions()
    }

    return () => {
      if (elm) {
        resizeObserver.unobserve(elm)
      }
    }
  }, [parentRef, fileName])

  const activeStage = useMemo(
    () => getActiveStageDetail(launchpad.stages),
    [launchpad.stages],
  )

  // form
  const {
    register,
    watch,
    formState: { errors },
  } = useForm<FormData>()

  const oath = watch('oath')
  const content = watch('content')
  const name = watch('name')

  const disabled = !oath || !fileName || !name

  // upload
  const uploadApi = useUploadApi()

  const [selectedInscription, setSelectedInscription] =
    useState<NFTMetadata | null>(null)
  const cat = useInscriptionUrl(
    data.folder,
    selectedInscription?.filename ?? '',
  )

  return (
    <div className="flex flex-col lg:flex-row w-full max-w-[1920px] gap-8">
      <div className="flex flex-1 flex-col items-center">
        <LaunchpadInscriptionSelect
          className="max-w-md w-full mb-8"
          folder={data.folder}
          inscriptions={data.inscriptions}
          title="Select a cat"
          onSelect={setSelectedInscription}
        />

        {preview && (
          <div className="mb-4">
            <div className="relative" ref={parentRef}>
              <img
                src={preview}
                alt="Inscription preview"
                // className="max-w-xl"
              />

              <Rnd
                className="flex items-center justify-center border border-black border-dashed absolute"
                size={size}
                bounds="parent"
                minWidth={minWidth}
                minHeight={minHeight}
                position={position}
                lockAspectRatio={ratio}
                onDragStop={(e, d) => {
                  updatePosition({ x: d.x, y: d.y })
                }}
                onResizeStop={(e, direction, ref, delta, position) => {
                  updateSize({
                    width: parseInt(ref.style.width),
                    height: parseInt(ref.style.height),
                  })
                  updatePosition(position)
                }}
              >
                <img
                  src={cat}
                  alt="Slowblink Cat"
                  draggable="false"
                  className="pointer-events-none"
                />
              </Rnd>
            </div>
          </div>
        )}

        <ContentInput
          title="Upload your PFP to attach the Slowblink Cat 🐱"
          fileName={fileName}
          error={errors.content}
          register={register}
          disabled={selectedInscription == null}
          fileChange={(file) => {
            setFileName(file?.name ?? null)

            if (file && file.type.startsWith('image/')) {
              setPreview(URL.createObjectURL(file))
            } else {
              setPreview(null)
            }
          }}
        />
      </div>

      <div className="rounded-b-xl flex flex-1 flex-col items-start">
        <div
          className="CollapsibleDescription
        flex flex-col"
        >
          <h2 className="text-3xl">{collection.name}</h2>
        </div>
        <CollectionSocials collection={collection} isLaunchpad />
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

        <Input
          id="name"
          placeholder="Your name"
          className={clsx('w-full mt-4', {
            'border-accent': !name,
            'border-success': !!name,
          })}
          color={errors.name ? 'error' : undefined}
          {...register('name', {
            required: true,
          })}
        />

        <Alert
          className={clsx('mt-4 border', {
            'border-accent': !oath,
            'border-success': !!oath,
          })}
        >
          <Label>
            <Checkbox
              size="md"
              color={errors.oath ? 'error' : undefined}
              {...register('oath', {
                required: true,
              })}
            />
            <span
              className={clsx('flex items-center ml-4', {
                'text-error': errors.oath,
              })}
            >
              I promise that if I have a conflict with anyone else who has also
              taken this oath, then I will seek to find a win-win resolution,
              with the help of the community if necessary.
            </span>
          </Label>
        </Alert>

        <MintInscription
          launchpad={launchpad}
          className="mt-4 w-full"
          activeStage={activeStage}
          disabled={disabled}
          price={selectedInscription?.price}
          metadataProvider={async () => {
            // upload image to s3
            const file = content[0]
            const fileExt = getFileExtension(file.name)

            const { signedUrl, folder, filename, assetId } =
              await uploadApi.uploadAsset(
                launchpad.transaction.hash,
                file.type,
                fileExt,
              )
            await uploadApi.upload(signedUrl, file)
            await uploadApi.confirmAsset(launchpad.transaction.hash, assetId)

            const url = `${assetsUrl}/${folder}/${filename}`

            return {
              name,
              pfp: url,
              token_id: selectedInscription!.token_id,
              coords: {
                x: position.x / parentSize.width,
                y: position.y / parentSize.height,
                width: size.width / parentSize.width,
                height: size.height / parentSize.height,
              },
            }
          }}
        />

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
