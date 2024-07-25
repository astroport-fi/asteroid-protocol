import type { NFTMetadata } from '@asteroid-protocol/sdk'
import { inscription } from '@asteroid-protocol/sdk/metaprotocol'
import { ArrowUpIcon, CheckIcon, PlusIcon } from '@heroicons/react/20/solid'
import { LoaderFunctionArgs, json } from '@remix-run/cloudflare'
import { useLoaderData } from '@remix-run/react'
import { useEffect, useState } from 'react'
import { Button, Divider, Form, Select } from 'react-daisyui'
import { useFieldArray, useForm } from 'react-hook-form'
import { AsteroidClient } from '~/api/client'
import { CreatorLaunch } from '~/api/launchpad'
import InfoTooltip from '~/components/InfoTooltip'
import Label from '~/components/form/Label'
import {
  ContentInput,
  Description,
  Name,
} from '~/components/inscription-form/Inputs'
import Trait from '~/components/inscription-form/Trait'
import { Wallet } from '~/components/wallet/Wallet'
import useUploadApi from '~/hooks/api/useUploadApi'
import useAddress from '~/hooks/wallet/useAddress'
import { getAddress } from '~/utils/cookies'

export async function loader({ context, params, request }: LoaderFunctionArgs) {
  const address = await getAddress(request)

  const asteroidClient = new AsteroidClient(context.cloudflare.env.ASTEROID_API)
  let launchpadHash: string | undefined = undefined
  if (params.symbol) {
    launchpadHash = await asteroidClient.getLaunchpadHash(params.symbol)
  }

  let launches: CreatorLaunch[]
  if (address) {
    launches = await asteroidClient.getCreatorLaunches(address)
  } else {
    launches = []
  }

  return json({ launchpadHash: launchpadHash, launches })
}

type FormData = {
  name: string
  description: string
  content: File[]
  launchpad: string
  newTraits: inscription.Trait[]
}

enum UploadState {
  IDLE,
  UPLOADING,
  UPLOADED,
}

export default function CreateInscription() {
  const { launchpadHash, launches } = useLoaderData<typeof loader>()
  const address = useAddress()
  const uploadApi = useUploadApi()
  const [uploadState, setUploadState] = useState<UploadState>(UploadState.IDLE)

  useEffect(() => {
    if (uploadState !== UploadState.UPLOADED) {
      return
    }

    const timeout = setTimeout(() => {
      setUploadState(UploadState.IDLE)
    }, 10000)

    return () => clearTimeout(timeout)
  }, [uploadState])

  // form
  const {
    register,
    handleSubmit,
    watch,
    control,
    formState: { errors },
  } = useForm<FormData>({ defaultValues: { launchpad: launchpadHash } })
  const name = watch('name')

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'newTraits',
  })

  // preview
  const [preview, setPreview] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)

  const onSubmit = handleSubmit(async (data) => {
    setUploadState(UploadState.UPLOADING)

    const file = data.content[0]
    const fileBuffer = await file.arrayBuffer()
    const byteArray = new Uint8Array(fileBuffer)
    if (!byteArray.byteLength) {
      console.warn('No file data')
      return
    }

    // upload inscription and metadata
    const fileExt = file.name.split('.').pop() as string

    const { inscriptionSignedUrl, metadataSignedUrl, inscriptionNumber } =
      await uploadApi.inscriptionUrls(data.launchpad, file.type, fileExt)

    // prepare metadata
    const metadata: NFTMetadata = {
      name: data.name,
      description: data.description,
      mime: file.type,
      filename: `${inscriptionNumber}.${fileExt}`,
      token_id: inscriptionNumber,
    }

    if (data.newTraits.length > 0) {
      metadata.attributes = data.newTraits.filter(
        (trait) => trait.trait_type && trait.value,
      )
    }

    // upload assets
    await uploadApi.upload(inscriptionSignedUrl, file)
    await uploadApi.upload(
      metadataSignedUrl,
      new Blob([JSON.stringify(metadata)], { type: 'application/json' }),
    )

    // confirm
    await uploadApi.confirm(data.launchpad, inscriptionNumber)

    setUploadState(UploadState.UPLOADED)
  })

  return (
    <div className="flex flex-col items-center w-full">
      <Form onSubmit={onSubmit} className="flex flex-col mt-4 w-full">
        <div className="flex flex-col lg:flex-row">
          <div className="flex flex-1 flex-col items-center">
            {preview && (
              <img
                src={preview}
                alt="Inscription preview"
                className="max-w-48 mb-4"
              />
            )}

            <ContentInput
              fileName={fileName}
              error={errors.content}
              register={register}
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
          <div className="flex flex-1 flex-col mt-4 lg:mt-0 lg:ml-8">
            <strong>Upload an inscription for launchpad</strong>

            <div className="form-control w-full mt-6">
              <Label title="Launchpad" htmlFor="launchpad" />
              <Select
                id="collection"
                className="w-full"
                color={errors.launchpad ? 'error' : undefined}
                {...register('launchpad', {
                  required: true,
                  minLength: 64,
                })}
              >
                <Select.Option value={0}>Select collection</Select.Option>
                {launches.map((launch) => (
                  <Select.Option
                    key={launch.transaction.hash}
                    value={launch.transaction.hash}
                  >
                    {launch.collection.name}
                  </Select.Option>
                ))}
              </Select>
            </div>

            <Name register={register} name={name} error={errors.name} />

            <Description register={register} />

            <Divider className="mt-8 flex !gap-2">
              <span>Traits</span>
              <InfoTooltip
                className="whitespace-pre-wrap"
                message="Add as many traits as you'd like(i.e. hair color, strength, weaknesses, etc.)"
              />
            </Divider>

            {fields.map((item, index) => (
              <Trait
                key={item.id}
                register={register}
                remove={() => remove(index)}
                traitType={`newTraits.${index}.trait_type`}
                traitValue={`newTraits.${index}.value`}
                traitTypeError={errors['newTraits']?.[index]?.trait_type}
                traitValueError={errors['newTraits']?.[index]?.value}
              />
            ))}

            <Button
              color="accent"
              className="mt-4"
              startIcon={<PlusIcon className="size-5" />}
              type="button"
              onClick={() => append({ trait_type: '', value: '' })}
            >
              Add trait
            </Button>
            <Divider />

            {address ? (
              uploadState === UploadState.UPLOADING ? (
                <Button loading color="primary" className="mt-4">
                  Uploading...
                </Button>
              ) : uploadState === UploadState.UPLOADED ? (
                <Button
                  color="success"
                  className="mt-4"
                  startIcon={<CheckIcon className="size-5" />}
                >
                  Uploaded
                </Button>
              ) : (
                <Button
                  type="submit"
                  color="primary"
                  className="mt-4"
                  startIcon={<ArrowUpIcon className="size-5" />}
                >
                  Upload
                </Button>
              )
            ) : (
              <Wallet className="mt-4 btn-md w-full" color="primary" />
            )}
          </div>
        </div>
      </Form>
    </div>
  )
}
