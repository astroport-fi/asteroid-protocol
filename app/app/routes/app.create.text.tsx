import { NFTMetadata, TxInscription } from '@asteroid-protocol/sdk'
import { CheckIcon, PlusIcon } from '@heroicons/react/20/solid'
import {
  BlockTypeSelect,
  BoldItalicUnderlineToggles,
  ChangeCodeMirrorLanguage,
  CodeToggle,
  ConditionalContents,
  CreateLink,
  InsertCodeBlock,
  InsertTable,
  InsertThematicBreak,
  ListsToggle,
  MDXEditor,
  MDXEditorMethods,
  Separator,
  UndoRedo,
  codeBlockPlugin,
  codeMirrorPlugin,
  headingsPlugin,
  linkDialogPlugin,
  linkPlugin,
  listsPlugin,
  markdownShortcutPlugin,
  quotePlugin,
  tablePlugin,
  thematicBreakPlugin,
  toolbarPlugin,
} from '@mdxeditor/editor'
import { LoaderFunctionArgs, json } from '@remix-run/cloudflare'
import { Link, useLoaderData } from '@remix-run/react'
import clsx from 'clsx'
import { useRef, useState } from 'react'
import { Button, FileInput, Form, Input, Select } from 'react-daisyui'
import { useForm } from 'react-hook-form'
import { AsteroidClient } from '~/api/client'
import InfoTooltip from '~/components/InfoTooltip'
import TxDialog from '~/components/dialogs/TxDialog'
import Label from '~/components/form/Label'
import { Wallet } from '~/components/wallet/Wallet'
import { useRootContext } from '~/context/root'
import { useDialogWithValue } from '~/hooks/useDialog'
import { useInscriptionOperations } from '~/hooks/useOperations'
import { getAddress } from '~/utils/cookies'
import '@mdxeditor/editor/style.css'

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
  name: string
  content: File[]
  collection: string | null
}

const NAME_MIN_LENGTH = 3
const NAME_MAX_LENGTH = 1024

export default function TextInscriptionPage() {
  const data = useLoaderData<typeof loader>()
  const { maxFileSize } = useRootContext()
  const operations = useInscriptionOperations()

  // form
  const {
    register,
    handleSubmit,
    watch,
    control,
    formState: { errors },
    reset,
  } = useForm<FormData>()
  const name = watch('name')

  // preview
  const [preview, setPreview] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)

  // dialog
  const { dialogRef, value, showDialog } = useDialogWithValue<TxInscription>()

  // editor
  const editorRef = useRef<MDXEditorMethods>(null)

  // submit
  const onSubmit = handleSubmit(async (data) => {
    if (!operations) {
      console.warn('No address')
      return
    }

    const file = data.content[0]
    const fileBuffer = await file.arrayBuffer()
    const byteArray = new Uint8Array(fileBuffer)
    if (!byteArray.byteLength) {
      console.warn('No file data')
      return
    }

    const description = editorRef.current?.getMarkdown()

    const metadata: NFTMetadata = {
      name: data.name,
      description: description ?? '',
      mime: file.type,
    }

    let txInscription
    if (data.collection && data.collection !== '0') {
      txInscription = operations.inscribeCollectionInscription(
        data.collection,
        byteArray,
        metadata,
      )
    } else {
      txInscription = operations.inscribe(byteArray, metadata)
    }

    showDialog(txInscription)
  })

  return (
    <div className="w-full">
      <Form onSubmit={onSubmit} className="flex flex-col items-center mt-4">
        <div className="flex flex-row w-full justify-between">
          <h1 className="text-xl">Create new article</h1>
          {operations ? (
            <Button
              type="submit"
              color="primary"
              startIcon={<CheckIcon className="size-5" />}
            >
              Inscribe
            </Button>
          ) : (
            <Wallet className="btn-md" color="primary" />
          )}
        </div>
        <div className="flex flex-row w-full mt-8">
          <div className="flex flex-1 flex-col mr-8">
            <div className="form-control w-full">
              <Form.Label title="Article title" htmlFor="name" />
              <Input
                id="name"
                placeholder="Add a title for your article"
                color={errors.name ? 'error' : undefined}
                maxLength={NAME_MAX_LENGTH}
                minLength={NAME_MIN_LENGTH}
                {...register('name', {
                  required: true,
                  minLength: NAME_MIN_LENGTH,
                  maxLength: NAME_MAX_LENGTH,
                })}
              />
              <label className="label" htmlFor="name">
                <span className="label-text-alt text-error">
                  {errors.name &&
                    `Name is required and must be 3-${NAME_MAX_LENGTH} characters long.`}
                </span>
                <span className="label-text-alt">
                  {name?.length ?? 0} / {NAME_MAX_LENGTH}
                </span>
              </label>
            </div>

            <div className="form-control w-full mt-6">
              <Label
                title="Collection (optional)"
                htmlFor="collection"
                tooltip="If you plan to inscribe more than 1 related inscription, consider grouping them into a collection for easier discoverability in the Asteroid marketplace"
              />
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
                  target="_blank"
                >
                  <PlusIcon className="size-5" />
                </Link>
              </div>
            </div>
          </div>
          <div className="flex flex-1 flex-col items-center">
            {preview && (
              <img
                src={preview}
                alt="Inscription preview"
                className="mb-4 max-h-24"
              />
            )}

            <div
              className={clsx('flex flex-col items-center justify-center', {
                ['bg-base-200 border border-neutral border-dashed rounded-3xl p-8 w-full h-full']:
                  fileName == null,
              })}
            >
              {fileName ? (
                <span className="text-center">{fileName}</span>
              ) : (
                <>
                  <span className="flex items-center justify-center text-lg">
                    Article cover image
                    <InfoTooltip
                      message="Can be a custom image (550kb max)"
                      className="ml-2"
                    />
                  </span>
                </>
              )}

              <label htmlFor="content" className="btn btn-accent mt-4">
                {fileName ? 'Change file' : 'Select file'}
              </label>
              <FileInput
                key="content"
                id="content"
                className="opacity-0 h-0"
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
        </div>

        <MDXEditor
          className="w-full mt-8"
          contentEditableClassName="prose bg-base-200 max-w-full overflow-y-scroll h-[calc(100vh-35rem)]"
          markdown="# Hello world"
          plugins={[
            headingsPlugin(),
            listsPlugin(),
            quotePlugin(),
            thematicBreakPlugin(),
            linkPlugin(),
            linkDialogPlugin(),
            // imagePlugin(),
            tablePlugin(),
            codeBlockPlugin({ defaultCodeBlockLanguage: 'ts' }),
            codeMirrorPlugin({
              codeBlockLanguages: {
                js: 'JavaScript',
                ts: 'TypeScript',
                css: 'CSS',
              },
            }),
            markdownShortcutPlugin(),
            toolbarPlugin({
              toolbarContents: () => (
                <>
                  <UndoRedo />
                  <Separator />
                  <BlockTypeSelect />
                  <Separator />
                  <BoldItalicUnderlineToggles />
                  <CodeToggle />
                  <Separator />
                  <ListsToggle />
                  <Separator />
                  <CreateLink />
                  <InsertTable />
                  <InsertThematicBreak />
                  <ConditionalContents
                    options={[
                      {
                        when: (editor) => editor?.editorType === 'codeblock',
                        contents: () => <ChangeCodeMirrorLanguage />,
                      },
                      {
                        fallback: () => <InsertCodeBlock />,
                      },
                    ]}
                  />
                  {/* <InsertImage /> */}
                </>
              ),
            }),
          ]}
          ref={editorRef}
        />
      </Form>
      <TxDialog
        ref={dialogRef}
        txInscription={value}
        resultLink={(txHash) => `/article/${txHash}`}
        resultCTA="View article"
        onSuccess={() => {
          reset()
          setFileName(null)
        }}
      />
    </div>
  )
}
