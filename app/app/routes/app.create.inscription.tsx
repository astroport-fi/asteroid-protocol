import type { NFTMetadata, TxInscription } from '@asteroid-protocol/sdk'
import { CheckIcon, PlusIcon } from '@heroicons/react/20/solid'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { LoaderFunctionArgs, json } from '@remix-run/cloudflare'
import { useLoaderData } from '@remix-run/react'
import clsx from 'clsx'
import { useMemo, useState } from 'react'
import {
  Button,
  Divider,
  FileInput,
  Form,
  Input,
  Link,
  Select,
  Textarea,
} from 'react-daisyui'
import { Controller, useFieldArray, useForm } from 'react-hook-form'
import { AsteroidClient } from '~/api/client'
import { CollectionTrait } from '~/api/collection'
import Autocomplete from '~/components/Autocomplete'
import TxDialog from '~/components/dialogs/TxDialog'
import { Wallet } from '~/components/wallet/Wallet'
import { useRootContext } from '~/context/root'
import useCollection from '~/hooks/useCollection'
import useDialog from '~/hooks/useDialog'
import { useInscriptionOperations } from '~/hooks/useOperations'
import { getAddress } from '~/utils/cookies'
import { getTraitsMap } from '~/utils/traits'

export async function loader({ context, request }: LoaderFunctionArgs) {
  const address = await getAddress(request)
  if (!address) {
    return json({ collections: [] })
  }

  const asteroidClient = new AsteroidClient(context.cloudflare.env.ASTEROID_API)
  const collections = await asteroidClient.getCollections(0, 500, {
    creator: address,
  })

  return json({ collections })
}

type FormData = {
  name: string
  description: string
  content: File[]
  collection: string | null
  traits: Record<string, string>
  newTraits: { trait_type: string; value: string }[]
}

const NAME_MIN_LENGTH = 3
const NAME_MAX_LENGTH = 32

export default function CreateInscription() {
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
  } = useForm<FormData>()
  const name = watch('name')
  const collectionId = watch('collection')

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'newTraits',
  })

  const { data: collection } = useCollection(parseInt(collectionId ?? '0'))
  const traitsMap = useMemo(() => {
    if (!collection) {
      return null
    }
    return getTraitsMap(collection.traits as CollectionTrait[])
  }, [collection])

  const traitsComponents: JSX.Element[] = []
  if (traitsMap) {
    for (const [trait, values] of traitsMap) {
      traitsComponents.push(
        <div className="form-control w-full mb-4" key={trait}>
          <Form.Label title={trait} htmlFor={trait} />

          <Controller
            control={control}
            name={`traits.${trait}`}
            render={({
              field: { name, onChange, value, ref, onBlur, disabled },
            }) => (
              <Autocomplete
                key={trait}
                items={values.map((v) => v.value)}
                name={name}
                onChange={onChange}
                value={value ?? ''}
                ref={ref}
                disabled={disabled}
                onBlur={onBlur}
              />
            )}
          />
        </div>,
      )
    }
  }

  // preview
  const [preview, setPreview] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)

  // dialog
  const { dialogRef, handleShow } = useDialog()
  const [txInscription, setTxInscription] = useState<TxInscription | null>(null)

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

    const traits = Object.entries(data.traits)
      .map(([trait_type, value]) => ({
        trait_type,
        value,
      }))
      .concat(data.newTraits)
      .filter((trait) => trait.trait_type && trait.value)

    const metadata: NFTMetadata = {
      name: data.name,
      description: data.description,
      mime: file.type,
    }

    if (traits.length > 0) {
      metadata.attributes = traits
    }

    let txInscription
    if (data.collection) {
      txInscription = operations.inscribeCollectionInscription(
        data.collection,
        byteArray,
        metadata,
      )
    } else {
      txInscription = operations.inscribe(byteArray, metadata)
    }

    setTxInscription(txInscription)

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
            <Form.Label title="Collection" htmlFor="collection" />
            <Select
              id="collection"
              color={errors.collection ? 'error' : undefined}
              {...register('collection')}
            >
              <Select.Option value={0}>Select collection</Select.Option>
              {data.collections.map((collection) => (
                <Select.Option key={collection.id} value={collection.id}>
                  {collection.name}
                </Select.Option>
              ))}
            </Select>
          </div>

          <div className="form-control w-full mt-6">
            <Form.Label title="Name" htmlFor="name" />
            <Input
              id="name"
              placeholder="Name your inscription"
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

          <Divider className="mt-8">Traits</Divider>

          {traitsMap && traitsComponents}

          {fields.map((item, index) => (
            <div
              key={item.id}
              className="flex  w-full justify-between gap-4 mb-2"
            >
              <div className="form-control w-full">
                <Form.Label
                  title="Name"
                  htmlFor={`newTraits.${index}.trait_type`}
                />
                <Input
                  id={`newTraits.${index}.trait_type`}
                  {...register(`newTraits.${index}.trait_type`)}
                />
              </div>
              <div className="form-control w-full">
                <Form.Label
                  title="Value"
                  htmlFor={`newTraits.${index}.value`}
                />
                <Input
                  id={`newTraits.${index}.value`}
                  {...register(`newTraits.${index}.value`)}
                />
              </div>
              <Button
                type="button"
                shape="circle"
                className="mt-12"
                color="error"
                size="xs"
                onClick={() => remove(index)}
              >
                <XMarkIcon className="size-5" />
              </Button>
            </div>
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

          {operations ? (
            <Button
              type="submit"
              color="primary"
              className="mt-4"
              startIcon={<CheckIcon className="size-5" />}
            >
              Inscribe
            </Button>
          ) : (
            <Wallet className="mt-4 btn-md w-full" color="primary" />
          )}
        </div>
      </Form>
      <TxDialog ref={dialogRef} txInscription={txInscription} />
    </div>
  )
}
