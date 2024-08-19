import type { NFTMetadata } from '@asteroid-protocol/sdk'
import { inscription } from '@asteroid-protocol/sdk/metaprotocol'
import { ArrowUpIcon, CheckIcon, PlusIcon } from '@heroicons/react/20/solid'
import { useEffect, useState } from 'react'
import { Button, Divider, Form, Loading } from 'react-daisyui'
import { useFieldArray, useForm } from 'react-hook-form'
import InfoTooltip from '~/components/InfoTooltip'
import { Description, Name } from '~/components/inscription-form/Inputs'
import Trait from '~/components/inscription-form/Trait'
import { Wallet } from '~/components/wallet/Wallet'
import { useRootContext } from '~/context/root'
import useUploadApi from '~/hooks/api/useUploadApi'
import { useInvalidateUploadedInscriptions } from '~/hooks/uploader/useInscriptions'
import useAddress from '~/hooks/wallet/useAddress'

type FormData = {
  name: string
  description: string
  traits: inscription.Trait[]
}

enum UploadState {
  IDLE,
  UPLOADING,
  UPLOADED,
}

export default function EditMetadata({
  launchpadHash,
  tokenId,
}: {
  launchpadHash: string
  tokenId: number
}) {
  const address = useAddress()
  const uploadApi = useUploadApi()
  const [uploadState, setUploadState] = useState<UploadState>(UploadState.IDLE)
  const invalidate = useInvalidateUploadedInscriptions(launchpadHash)
  const { assetsUrl } = useRootContext()
  const [metadata, setMetadata] = useState<NFTMetadata | null>(null)
  const [isLoading, setIsLoading] = useState(true)

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
    setError,
    reset,
    control,
    formState: { errors },
  } = useForm<FormData>()
  const name = watch('name')

  useEffect(() => {
    setIsLoading(true)
    const url = `${assetsUrl}/${launchpadHash}/${tokenId}_metadata.json?${Date.now()}`
    fetch(url)
      .then((res) => res.json<NFTMetadata>())
      .then((data) => {
        setMetadata(data)
        let traits = data.attributes as inscription.Trait[]
        if (!traits) {
          traits = []
        }
        reset({ ...data, traits })
        setIsLoading(false)
      })
  }, [assetsUrl, launchpadHash, tokenId, reset])

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'traits',
  })

  const onSubmit = handleSubmit(async (data) => {
    if (!metadata) {
      setError('name', {
        type: 'upload',
        message: 'Failed to fetch metadata',
      })
      return
    }

    setUploadState(UploadState.UPLOADING)

    try {
      const metadataSignedUrl = await uploadApi.editMetadata(
        launchpadHash,
        tokenId,
      )

      // prepare metadata
      const newMetadata: NFTMetadata = {
        ...metadata,
        name: data.name,
        description: data.description,
      }

      if (data.traits.length > 0) {
        newMetadata.attributes = data.traits.filter(
          (trait) => trait.trait_type && trait.value,
        )
      } else {
        newMetadata.attributes = []
      }

      // upload assets
      await uploadApi.upload(
        metadataSignedUrl,
        new Blob([JSON.stringify(newMetadata)], { type: 'application/json' }),
      )

      setUploadState(UploadState.UPLOADED)
      invalidate()
    } catch (error) {
      console.error(error)
      setError('name', {
        type: 'upload',
        message: 'Failed to upload inscription',
      })
      setUploadState(UploadState.IDLE)
    }
  })

  return (
    <div className="flex flex-col items-center w-full">
      <Form onSubmit={onSubmit} className="flex flex-col mt-4 w-full">
        <strong className="flex text-lg text-center">
          {isLoading && <Loading className="mr-2" />} Edit &quot;
          {metadata?.filename}&quot; inscription metadata
        </strong>

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
            traitType={`traits.${index}.trait_type`}
            traitValue={`traits.${index}.value`}
            traitTypeError={errors['traits']?.[index]?.trait_type}
            traitValueError={errors['traits']?.[index]?.value}
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
              Updating...
            </Button>
          ) : uploadState === UploadState.UPLOADED ? (
            <Button
              color="success"
              className="mt-4"
              startIcon={<CheckIcon className="size-5" />}
            >
              Updated
            </Button>
          ) : (
            <Button
              type="submit"
              color="primary"
              className="mt-4"
              startIcon={<ArrowUpIcon className="size-5" />}
            >
              Update
            </Button>
          )
        ) : (
          <Wallet className="mt-4 btn-md w-full" color="primary" />
        )}
      </Form>
    </div>
  )
}
