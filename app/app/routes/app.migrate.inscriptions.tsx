import type { TxInscription } from '@asteroid-protocol/sdk'
import { inscription } from '@asteroid-protocol/sdk/metaprotocol'
import { CheckIcon, PlusIcon } from '@heroicons/react/20/solid'
import { LoaderFunctionArgs, json } from '@remix-run/cloudflare'
import { Link, useLoaderData } from '@remix-run/react'
import clsx from 'clsx'
import { useState } from 'react'
import {
  Button,
  Link as DaisyLink,
  FileInput,
  Form,
  Select,
} from 'react-daisyui'
import { useForm } from 'react-hook-form'
import { inferSchema, initParser } from 'udsv'
import { AsteroidClient } from '~/api/client'
import TxDialog from '~/components/dialogs/TxDialog'
import { Wallet } from '~/components/wallet/Wallet'
import { useRootContext } from '~/context/root'
import { useDialogWithValue } from '~/hooks/useDialog'
import { useInscriptionOperations } from '~/hooks/useOperations'
import { getAddress } from '~/utils/cookies'

export async function loader({ context, request }: LoaderFunctionArgs) {
  const address = await getAddress(request)
  if (!address) {
    return json({ collections: [] })
  }

  const asteroidClient = new AsteroidClient(context.cloudflare.env.ASTEROID_API)
  const res = await asteroidClient.getCollections(0, 500, {
    creator: address,
  })

  return json({ collections: res.collections })
}

type FormData = {
  content: File[]
  collection: string | null
}

export default function CreateInscription() {
  const data = useLoaderData<typeof loader>()
  const { maxFileSize } = useRootContext()
  const operations = useInscriptionOperations()

  // form
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>()
  // preview
  const [fileName, setFileName] = useState<string | null>(null)

  // dialog
  const { dialogRef, showDialog, value } = useDialogWithValue<TxInscription>()

  const onSubmit = handleSubmit(async (data) => {
    if (!operations) {
      console.warn('No address')
      return
    }

    const file = data.content[0]
    const csvStr = await file.text()
    if (!csvStr) {
      console.warn('Invalid CSV')
      return
    }

    const schema = inferSchema(csvStr, { trim: true })
    const parser = initParser(schema)

    const metadata: inscription.MigrationData = {
      header: schema.cols.map((col) => col.name),
      rows: parser.stringArrs(csvStr),
    }
    if (data.collection && data.collection !== '0') {
      metadata.collection = data.collection
    }

    const txInscription = operations.migrate(metadata)
    showDialog(txInscription)
  })

  return (
    <div>
      <Form onSubmit={onSubmit} className="flex flex-row mt-8">
        <div className="flex flex-1 flex-col items-center">
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
                <span className="text-lg text-center">Migration CSV</span>
                <p className="mt-4">
                  Learn how to create and format your CSV
                  <DaisyLink
                    className="mx-1"
                    color="primary"
                    href="https://www.notion.so/Asteroid-Protocol-Docs-c3fb7993254b4c2e814c42e76a1acec3?pvs=4#10b905a54c734095b57007f54ed1183a"
                    target="_blank"
                  >
                    here
                  </DaisyLink>
                  .
                </p>
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
              }}
            />
            {errors.content && (
              <span className="text-error">
                {errors.content.message
                  ? errors.content.message
                  : 'Migration CSV file is required'}
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-1 flex-col ml-8">
          <strong>Inscription migration</strong>
          <p className="mt-2">
            Use this form to migrate any pre-existing inscriptions into a
            collection to take advantage of new collections-related features
            including royalties and rarity traits. Learn more
            <DaisyLink
              className="mx-1"
              color="primary"
              href="https://www.notion.so/Asteroid-Protocol-Docs-c3fb7993254b4c2e814c42e76a1acec3?pvs=4#225d1e61b7e7482fb89aab7941c0b65b"
              target="_blank"
            >
              here
            </DaisyLink>
            .
          </p>

          <div className="form-control w-full mt-6">
            <Form.Label title="Collection (optional)" htmlFor="collection" />
            <div className="flex w-full gap-4 items-center">
              <Select
                id="collection"
                className="w-full"
                color={errors.collection ? 'error' : undefined}
                {...register('collection')}
              >
                <Select.Option value={0}>Select collection</Select.Option>
                {data.collections.map((collection) => (
                  <Select.Option
                    key={collection.transaction.hash}
                    value={collection.transaction.hash}
                  >
                    {collection.name}
                  </Select.Option>
                ))}
              </Select>
              <Link
                className="btn btn-accent btn-sm btn-circle mr-1"
                to="/app/create/collection"
              >
                <PlusIcon className="size-5" />
              </Link>
            </div>
          </div>

          {operations ? (
            <Button
              type="submit"
              color="primary"
              className="mt-4"
              startIcon={<CheckIcon className="size-5" />}
            >
              Migrate
            </Button>
          ) : (
            <Wallet className="mt-4 btn-md w-full" color="primary" />
          )}
        </div>
      </Form>
      <TxDialog
        ref={dialogRef}
        txInscription={value}
        resultCTA="View inscriptions"
        resultLink="/app/wallet/inscriptions"
      />
    </div>
  )
}
