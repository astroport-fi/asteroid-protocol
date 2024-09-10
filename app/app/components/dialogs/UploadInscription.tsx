import type { NFTMetadata } from '@asteroid-protocol/sdk'
import { inscription } from '@asteroid-protocol/sdk/metaprotocol'
import { ArrowUpIcon, CheckIcon, PlusIcon } from '@heroicons/react/20/solid'
import { useEffect, useState } from 'react'
import { Button, Divider, Form } from 'react-daisyui'
import { useFieldArray, useForm } from 'react-hook-form'
import InfoTooltip from '~/components/InfoTooltip'
import {
  ContentInput,
  Description,
  Name,
} from '~/components/inscription-form/Inputs'
import Trait from '~/components/inscription-form/Trait'
import { Wallet } from '~/components/wallet/Wallet'
import useUploadApi from '~/hooks/api/useUploadApi'
import { useInvalidateUploadedInscriptions } from '~/hooks/uploader/useInscriptions'
import { useHasUploaderSession } from '~/hooks/useUploaderSession'
import useAddress from '~/hooks/wallet/useAddress'
import { getFileExtension } from '~/utils/string'
import CreateUploaderSession from '../CreateUploaderSession'

type FormData = {
  name: string
  description: string
  content: File[]
  newTraits: inscription.Trait[]
}

enum UploadState {
  IDLE,
  UPLOADING,
  UPLOADED,
}

export default function UploadInscription({
  launchpadHash,
}: {
  launchpadHash: string
}) {
  const address = useAddress()
  const uploadApi = useUploadApi()
  const [uploadState, setUploadState] = useState<UploadState>(UploadState.IDLE)
  const invalidate = useInvalidateUploadedInscriptions(launchpadHash)
  const hasUploaderSession = useHasUploaderSession()

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
    setUploadState(UploadState.UPLOADING)

    const file = data.content[0]
    const fileBuffer = await file.arrayBuffer()
    const byteArray = new Uint8Array(fileBuffer)
    if (!byteArray.byteLength) {
      console.warn('No file data')
      return
    }

    // upload inscription and metadata
    const fileExt = getFileExtension(file.name)

    try {
      const { inscriptionSignedUrl, metadataSignedUrl, tokenId } =
        await uploadApi.inscriptionUrls(launchpadHash, file.type, fileExt)

      // prepare metadata
      const metadata: NFTMetadata = {
        name: data.name,
        description: data.description,
        mime: file.type,
        filename: `${tokenId}.${fileExt}`,
        token_id: tokenId,
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
      await uploadApi.confirm(launchpadHash, tokenId)

      setUploadState(UploadState.UPLOADED)
      invalidate()
    } catch (error) {
      setError('content', {
        type: 'upload',
        message: 'Failed to upload inscription',
      })
      setUploadState(UploadState.IDLE)
    }
  })

  return (
    <div className="flex flex-col items-center w-full">
      <Form onSubmit={onSubmit} className="flex flex-col mt-4 w-full">
        <strong className="text-lg text-center">
          Upload an inscriptions one by one
        </strong>

        <div className="flex flex-col items-center mt-4">
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
          hasUploaderSession ? (
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
            <CreateUploaderSession />
          )
        ) : (
          <Wallet className="mt-4 btn-md w-full" color="primary" />
        )}
      </Form>
    </div>
  )
}
