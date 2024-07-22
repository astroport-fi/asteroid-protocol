import type { NFTMetadata } from '@asteroid-protocol/sdk'
import { inscription } from '@asteroid-protocol/sdk/metaprotocol'
import { CheckIcon, PlusIcon } from '@heroicons/react/20/solid'
import { LoaderFunctionArgs, json } from '@remix-run/cloudflare'
import { useLoaderData } from '@remix-run/react'
import { useState } from 'react'
import { Button, Divider, Form } from 'react-daisyui'
import { useFieldArray, useForm } from 'react-hook-form'
import { AsteroidClient } from '~/api/client'
import InfoTooltip from '~/components/InfoTooltip'
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

export async function loader({ context, request, params }: LoaderFunctionArgs) {
  if (!params.symbol) {
    throw new Response(null, {
      status: 404,
      statusText: 'Not Found',
    })
  }

  const address = await getAddress(request)
  if (!address) {
    return json(null)
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

type FormData = {
  name: string
  description: string
  content: File[]
  collection: string | null
  traits: Record<string, string>
  newTraits: inscription.Trait[]
}

export default function CreateInscription() {
  const launchpad = useLoaderData<typeof loader>()
  const address = useAddress()
  const uploadApi = useUploadApi()

  // form
  const {
    register,
    handleSubmit,
    watch,
    control,
    formState: { errors },
  } = useForm<FormData>()
  const name = watch('name')

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'newTraits',
  })

  // preview
  const [preview, setPreview] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)

  const onSubmit = handleSubmit(async (data) => {
    const file = data.content[0]
    const fileBuffer = await file.arrayBuffer()
    const byteArray = new Uint8Array(fileBuffer)
    if (!byteArray.byteLength) {
      console.warn('No file data')
      return
    }

    let traits: inscription.Trait[] = []
    if (data.newTraits) {
      traits = traits.concat(data.newTraits)
    }

    const metadata: NFTMetadata = {
      name: data.name,
      description: data.description,
      mime: file.type,
    }

    if (traits.length > 0) {
      metadata.attributes = traits.filter(
        (trait) => trait.trait_type && trait.value,
      )
    }

    // upload inscription and metadata
    const { inscriptionSignedUrl, metadataSignedUrl } =
      await uploadApi.inscriptionUrls(launchpad!.transaction.hash, file.type)

    const response1 = await uploadApi.upload(inscriptionSignedUrl, file)
    console.log('!!!response1', response1)

    const response2 = await uploadApi.upload(
      metadataSignedUrl,
      new Blob([JSON.stringify(metadata)], { type: 'application/json' }),
    )

    console.log('!!!response2', response2)
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
            <strong>Upload an inscription</strong>

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
              <Button
                type="submit"
                color="primary"
                className="mt-4"
                startIcon={<CheckIcon className="size-5" />}
              >
                Upload
              </Button>
            ) : (
              <Wallet className="mt-4 btn-md w-full" color="primary" />
            )}
          </div>
        </div>
      </Form>
    </div>
  )
}
