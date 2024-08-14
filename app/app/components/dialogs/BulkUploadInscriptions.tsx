import { NFTMetadata } from '@asteroid-protocol/sdk'
import { ArrowUpIcon, CheckIcon } from '@heroicons/react/20/solid'
import { useEffect, useState } from 'react'
import { Button, FileInput, Form } from 'react-daisyui'
import { useForm } from 'react-hook-form'
import { Wallet } from '~/components/wallet/Wallet'
import { useRootContext } from '~/context/root'
import useUploadApi from '~/hooks/api/useUploadApi'
import { useInvalidateUploadedInscriptions } from '~/hooks/uploader/useInscriptions'
import useAddress from '~/hooks/wallet/useAddress'

type FormData = {
  content: File[]
}

enum UploadState {
  IDLE,
  UPLOADING,
  UPLOADED,
}

export default function BulkUploadInscriptions({
  launchpadHash,
}: {
  launchpadHash: string
}) {
  const address = useAddress()
  const { maxFileSize } = useRootContext()
  const uploadApi = useUploadApi()
  const [uploadState, setUploadState] = useState<UploadState>(UploadState.IDLE)
  const invalidate = useInvalidateUploadedInscriptions(launchpadHash)

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
    setError,
    watch,
    formState: { errors },
  } = useForm<FormData>()

  const content = watch('content')
  const contentLength = content?.length ?? 0

  const onSubmit = handleSubmit(async (data) => {
    setUploadState(UploadState.UPLOADING)

    const inscriptions = new Map<number, NFTMetadata>()
    const contentByName = new Map<string, File>()

    for (const file of data.content) {
      if (file.name.endsWith('.json')) {
        const content = await file.text()
        try {
          const metadata = JSON.parse(content)
          if (!metadata.filename) {
            setError('content', {
              type: 'json',
              message: 'Missing filename in JSON',
            })
            setUploadState(UploadState.IDLE)
            return
          }
          if (!metadata.name) {
            setError('content', {
              type: 'json',
              message: 'Missing name in JSON',
            })
            setUploadState(UploadState.IDLE)
            return
          }
          if (!metadata.token_id) {
            setError('content', {
              type: 'json',
              message: 'Missing token_id in JSON',
            })
            setUploadState(UploadState.IDLE)
            return
          }
          inscriptions.set(metadata.token_id, metadata)
        } catch (err) {
          setError('content', {
            type: 'json',
            message: 'Invalid JSON',
          })
          setUploadState(UploadState.IDLE)
          return
        }
      } else {
        contentByName.set(file.name, file)
      }
    }

    for (const metadata of inscriptions.values()) {
      const content = contentByName.get(metadata.filename!)
      if (!content) {
        setError('content', {
          type: 'json',
          message: `Missing content file for ${metadata.filename}`,
        })
        setUploadState(UploadState.IDLE)
        return
      }

      metadata.mime = content.type
    }

    if (!inscriptions.size) {
      setError('content', {
        type: 'empty',
        message: 'No valid inscriptions found',
      })
      setUploadState(UploadState.IDLE)
      return
    }

    // get signed urls
    try {
      const urls = await uploadApi.bulkUpload(
        launchpadHash,
        Array.from(inscriptions.values()),
      )
      for (const { inscriptionSignedUrl, metadataSignedUrl, tokenId } of urls) {
        const metadata = inscriptions.get(tokenId)!
        const content = contentByName.get(metadata.filename!)!

        // upload assets
        await uploadApi.upload(inscriptionSignedUrl, content)
        await uploadApi.upload(
          metadataSignedUrl,
          new Blob([JSON.stringify(metadata)], { type: 'application/json' }),
        )
      }

      // confirm
      await uploadApi.bulkConfirm(
        launchpadHash,
        Array.from(inscriptions.keys()),
      )

      setUploadState(UploadState.UPLOADED)
      invalidate()
    } catch (err) {
      setError('content', {
        type: 'upload',
        message: 'Bulk upload failed',
      })
      setUploadState(UploadState.IDLE)
    }
  })

  return (
    <div className="flex flex-col items-center w-full">
      <Form onSubmit={onSubmit} className="flex flex-col mt-4 w-full">
        <div className="flex flex-col lg:flex-row">
          <div className="flex flex-1 flex-col mt-4 lg:mt-0 lg:ml-8">
            <strong className="text-lg text-center">
              Upload multiple inscriptions at once
            </strong>
            <p className="mt-4">
              You have to provide both inscription content files like{' '}
              <code>1.png</code>, <code>2.png</code>,... and inscription
              metadata file like <code>1.json</code>, <code>2.json</code>,...
            </p>

            <label htmlFor="content" className="btn btn-accent mt-4">
              {contentLength > 0 ? 'Change files' : 'Select files'}
            </label>
            <FileInput
              key="content"
              id="content"
              multiple
              className="opacity-0 w-10 h-4"
              {...register('content', {
                required: true,
                validate: async (files) => {
                  if (
                    Array.from(files).some((file) => file.size > maxFileSize)
                  ) {
                    return `File size exceeds maximum allowed size of ${maxFileSize / 1000} kb`
                  }
                },
              })}
            />
            {errors.content && (
              <span className="text-error">
                {errors.content.message
                  ? errors.content.message
                  : 'Inscription content is required'}
              </span>
            )}

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
