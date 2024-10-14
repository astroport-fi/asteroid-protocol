import type { TxInscription } from '@asteroid-protocol/sdk'
import { inscription } from '@asteroid-protocol/sdk/metaprotocol'
import { CheckIcon } from '@heroicons/react/20/solid'
import { LoaderFunctionArgs, json } from '@remix-run/cloudflare'
import { useLoaderData } from '@remix-run/react'
import clsx from 'clsx'
import { useState } from 'react'
import { Button, Link as DaisyLink, FileInput, Form } from 'react-daisyui'
import { useForm } from 'react-hook-form'
import { inferSchema, initParser } from 'udsv'
import { AsteroidClient } from '~/api/client'
import TxDialog from '~/components/dialogs/TxDialog'
import { CollectionSelect } from '~/components/form/CollectionSelect'
import { Wallet } from '~/components/wallet/Wallet'
import { useRootContext } from '~/context/root'
import { useDialogWithValue } from '~/hooks/useDialog'
import { useInscriptionOperations } from '~/hooks/useOperations'
import { getAddress } from '~/utils/cookies'

const ALLOWED_CHARACTERS_INFO = `
Trait name allowed characters
- a lowercase letter (a-z),
- an uppercase letter (A-Z),
- a digit (0-9),
- a hyphen (-)
- a space ( )

Trait value allowed characters
- a lowercase letter (a-z),
- an uppercase letter (A-Z),
- a digit (0-9),
- a hyphen (-)
- a period (.)
- a space ( )
`

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

async function getDataFromCsv(file: File) {
  const csvStr = await file.text()
  if (!csvStr) {
    return
  }

  const schema = inferSchema(csvStr, { trim: true, col: ',' })
  const parser = initParser(schema)

  const metadata: inscription.MigrationData = {
    header: schema.cols.map((col) => col.name),
    rows: parser.stringArrs(csvStr).filter((row: string[]) => !!row[0]),
  }

  const headerRegex = /^[a-zA-Z0-9- ]+$/
  const rowsRegex = /^[a-zA-Z0-9-. ]+$/
  const invalidCols = metadata.header.some((col) => !headerRegex.test(col))
  const invalidRows = metadata.rows.some((row) =>
    row.some((cell) => !rowsRegex.test(cell) && cell !== ''),
  )

  if (invalidCols || invalidRows) {
    return
  }
  return metadata
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
    const metadata = await getDataFromCsv(file)
    if (!metadata) {
      console.warn('Invalid CSV')
      return
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

                  const metadata = await getDataFromCsv(file)
                  if (!metadata) {
                    return `CSV file contains invalid characters\n${ALLOWED_CHARACTERS_INFO}`
                  }
                },
                onChange: (e) => {
                  const file = e.target.files?.[0]
                  setFileName(file?.name ?? null)
                },
              })}
              color={errors.content ? 'error' : undefined}
            />
            {errors.content && (
              <span className="text-error whitespace-pre-wrap">
                {errors.content.message
                  ? errors.content.message
                  : 'Migration CSV file is required'}
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-1 flex-col ml-8">
          <strong>Inscriptions migration</strong>
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

          <CollectionSelect
            collections={data.collections}
            error={errors.collection}
            register={register}
            title="Collection (optional)"
          />

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
