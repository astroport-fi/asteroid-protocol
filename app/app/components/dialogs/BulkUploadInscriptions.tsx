import { NFTMetadata } from '@asteroid-protocol/sdk'
import { inscription } from '@asteroid-protocol/sdk/metaprotocol'
import { ArrowUpIcon, CheckIcon } from '@heroicons/react/20/solid'
import { useEffect, useState } from 'react'
import { Button, FileInput, Form, Link } from 'react-daisyui'
import { useForm } from 'react-hook-form'
import { inferSchema, initParser } from 'udsv'
import { Wallet } from '~/components/wallet/Wallet'
import { useRootContext } from '~/context/root'
import useUploadApi from '~/hooks/api/useUploadApi'
import { useInvalidateUploadedInscriptions } from '~/hooks/uploader/useInscriptions'
import { useHasUploaderSession } from '~/hooks/useUploaderSession'
import useAddress from '~/hooks/wallet/useAddress'
import CreateUploaderSession from '../CreateUploaderSession'

type FormData = {
  content: File[]
}

enum UploadState {
  IDLE,
  UPLOADING,
  UPLOADED,
}

function validateMetadata(metadata: NFTMetadata, maxSupply: number) {
  if (!metadata.filename) {
    return 'Missing filename in metadata'
  }
  if (!metadata.name) {
    return 'Missing name in metadata'
  }
  if (!metadata.token_id) {
    return 'Missing token_id in metadata'
  }
  if (metadata.token_id < 1 || metadata.token_id > maxSupply) {
    return `token_id must be between 1 and ${maxSupply}`
  }
}

export default function BulkUploadInscriptions({
  launchpadHash,
  maxSupply,
}: {
  launchpadHash: string
  maxSupply: number
}) {
  const address = useAddress()
  const { maxFileSize } = useRootContext()
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
      if (file.name.endsWith('.csv')) {
        const content = await file.text()
        const schema = inferSchema(content, { trim: true, col: ',' })
        const parser = initParser(schema)
        const data = parser.typedObjs<Record<string, number | string>>(content)
        for (const row of data) {
          const attributes: inscription.Trait[] = Object.entries(row).reduce(
            (acc, [key, value]) => {
              if (
                key === 'token_id' ||
                key === 'filename' ||
                key === 'name' ||
                key === 'description'
              ) {
                return acc
              }
              acc.push({ trait_type: key, value: `${value}` })
              return acc
            },
            [] as inscription.Trait[],
          )

          const metadata: NFTMetadata & { token_id: number } = {
            token_id: row.token_id as number,
            name: row.name as string,
            filename: row.filename as string,
            attributes: attributes,
            description: row.description as string,
            mime: 'image/png',
            isExplicit: false,
          }

          const error = validateMetadata(metadata, maxSupply)
          if (error) {
            setError('content', {
              type: 'metadata',
              message: error,
            })
            setUploadState(UploadState.IDLE)
            return
          }

          inscriptions.set(metadata.token_id, metadata)
        }
      }

      if (file.name.endsWith('.json')) {
        const content = await file.text()
        try {
          const metadata = JSON.parse(content)
          const error = validateMetadata(metadata, maxSupply)
          if (error) {
            setError('content', {
              type: 'metadata',
              message: error,
            })
            setUploadState(UploadState.IDLE)
            return
          }

          inscriptions.set(metadata.token_id, metadata)
        } catch (err) {
          setError('content', {
            type: 'metadata',
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
          type: 'content',
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
        message:
          'No spreadsheet (a .csv file) or JSON files with metadata found',
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
              Select multiple image files and one spreadsheet (a .csv file),
              which includes all the metadata for your images. You can download
              a sample CSV file to accompany your images{' '}
              <Link
                href="https://docs.asteroidprotocol.io/creators-and-artists/creating-a-collection-with-the-launchpad#bulk-upload-option-1-add-metadata-with-a-.csv-file"
                target="_blank"
                className="underline"
              >
                here
              </Link>
              . Advanced users can also use individual JSON files instead of a
              spreadsheet. Learn more{' '}
              <Link
                href="https://docs.asteroidprotocol.io/creators-and-artists/creating-a-collection-with-the-launchpad#bulk-upload-method-2-add-metadata-with-json"
                target="_blank"
                className="underline"
              >
                here
              </Link>
              .
            </p>

            {hasUploaderSession && (
              <>
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
                        Array.from(files).some(
                          (file) => file.size > maxFileSize,
                        )
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
              </>
            )}

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
          </div>
        </div>
      </Form>
    </div>
  )
}
