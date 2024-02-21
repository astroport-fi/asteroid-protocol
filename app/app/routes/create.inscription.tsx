import { TxData } from '@asteroid-protocol/sdk'
import { CheckIcon } from '@heroicons/react/20/solid'
import clsx from 'clsx'
import { useState } from 'react'
import { Button, FileInput, Form, Input, Link, Textarea } from 'react-daisyui'
import { useForm } from 'react-hook-form'
import TxDialog from '~/components/dialogs/TxDialog'
import { useRootContext } from '~/context/root'
import useDialog from '~/hooks/useDialog'
import { useInscriptionOperations } from '~/hooks/useOperations'
import { toBase64 } from '~/utils/file'

type FormData = {
  name: string
  description: string
  content: File[]
}

export default function CreateInscription() {
  const { maxFileSize } = useRootContext()
  const operations = useInscriptionOperations()

  // form
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormData>()
  const name = watch('name')

  // preview
  const [preview, setPreview] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)

  // dialog
  const { dialogRef, handleShow } = useDialog()
  const [txData, setTxData] = useState<TxData | null>(null)

  const onSubmit = handleSubmit(async (data) => {
    if (!operations) {
      console.warn('No address')
      return
    }

    const file = data.content[0]
    const fileData = await toBase64(file)
    if (!fileData) {
      console.warn('No file data')
      return
    }

    const txData = operations.inscribe(fileData, {
      name: data.name,
      description: data.description,
      mime: file.type,
    })

    setTxData(txData)

    handleShow()
  })

  return (
    <div>
      <p>
        Inscriptions allow you to permanently write arbitrary data to the
        blockchain. The maximum size of an inscription is currently{' '}
        {maxFileSize / 1000}kb.
      </p>
      <p>
        Learn more in the
        <Link
          className="mx-1"
          color="primary"
          href="https://medium.com/@delphilabs/introducing-asteroid-protocol-an-open-source-framework-for-inscriptions-and-tokens-on-cosmos-hub-03df146d48b1"
          target="_blank"
        >
          inscription metaprotocol
        </Link>
        documentation
      </p>
      <Form onSubmit={onSubmit} className="flex flex-row mt-8">
        <div className="flex flex-1 flex-col items-center">
          {preview && (
            <img
              src={preview}
              alt="Inscription preview"
              className="max-w-48 mb-4"
            />
          )}

          <div
            className={clsx('flex flex-col', {
              ['bg-base-200 border border-neutral border-dashed rounded-3xl p-8']:
                fileName == null,
            })}
          >
            {fileName ? (
              <span className="text-center">{fileName}</span>
            ) : (
              <>
                <span className="text-lg text-center">Content</span>
                <span className="mt-4">Max file size</span>
                <span>550kb</span>
              </>
            )}

            <label htmlFor="content" className="btn btn-accent mt-4">
              {fileName ? 'Change file' : 'Select file'}
            </label>
            <FileInput
              key="content"
              id="content"
              className="opacity-0"
              {...register('content', {
                required: true,
                validate: async (files) => {
                  const file = files[0]

                  if (file.size > maxFileSize) {
                    return `File size exceeds maximum allowed size of ${maxFileSize / 1000} kb`
                  }
                },
              })}
              color={errors.content ? 'error' : undefined}
              onChange={(e) => {
                const file = e.target.files?.[0]
                setFileName(file?.name ?? null)

                if (file && file.type.startsWith('image/')) {
                  setPreview(URL.createObjectURL(file))
                } else {
                  setPreview(null)
                }
              }}
            />
            {errors.content && (
              <span className="text-error">
                {errors.content.message
                  ? errors.content.message
                  : 'Inscription content is required'}
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-1 flex-col ml-8">
          <strong>Inscription information</strong>
          <p className="mt-2">Add detail to your inscription</p>

          <div className="form-control w-full mt-6">
            <Form.Label title="Name" htmlFor="name" />
            <Input
              id="name"
              placeholder="Name your inscription"
              color={errors.name ? 'error' : undefined}
              {...register('name', {
                required: true,
                minLength: 3,
                maxLength: 32,
              })}
            />
            <label className="label" htmlFor="name">
              <span className="label-text-alt text-error">
                {errors.name &&
                  'Name is required and must be 3-32 characters long.'}
              </span>
              <span className="label-text-alt">{name?.length ?? 0} / 32</span>
            </label>
          </div>

          <div className="form-control w-full">
            <Form.Label title="Description" htmlFor="description" />
            <Textarea
              id="description"
              placeholder="Describe your inscription"
              rows={10}
              {...register('description')}
            />
          </div>

          <Button
            type="submit"
            color="primary"
            className="mt-4"
            startIcon={<CheckIcon className="size-5" />}
          >
            Inscribe
          </Button>
        </div>
      </Form>
      <TxDialog ref={dialogRef} txData={txData} />
    </div>
  )
}
