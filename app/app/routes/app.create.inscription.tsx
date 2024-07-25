import type { NFTMetadata, TxInscription } from '@asteroid-protocol/sdk'
import { inscription } from '@asteroid-protocol/sdk/metaprotocol'
import { CheckIcon, PlusIcon } from '@heroicons/react/20/solid'
import { LoaderFunctionArgs, json } from '@remix-run/cloudflare'
import { useLoaderData } from '@remix-run/react'
import { useMemo, useState } from 'react'
import { Button, Divider, Form } from 'react-daisyui'
import { Controller, useFieldArray, useForm } from 'react-hook-form'
import { AsteroidClient } from '~/api/client'
import { CollectionTrait } from '~/api/collection'
import InfoTooltip from '~/components/InfoTooltip'
import { InscribingNotSupportedWithLedger } from '~/components/alerts/InscribingNotSupportedWithLedger'
import TxDialog from '~/components/dialogs/TxDialog'
import Autocomplete from '~/components/form/Autocomplete'
import { CollectionSelect } from '~/components/form/CollectionSelect'
import {
  ContentInput,
  Description,
  Name,
} from '~/components/inscription-form/Inputs'
import Trait from '~/components/inscription-form/Trait'
import { Wallet } from '~/components/wallet/Wallet'
import { useRootContext } from '~/context/root'
import useCollection from '~/hooks/api/useCollection'
import { useDialogWithValue } from '~/hooks/useDialog'
import { useInscriptionOperations } from '~/hooks/useOperations'
import useIsLedger from '~/hooks/wallet/useIsLedger'
import { getAddress } from '~/utils/cookies'
import { getTraitsMap } from '~/utils/traits'

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
  description: string
  content: File[]
  collection: string | null
  traits: Record<string, string>
  newTraits: inscription.Trait[]
}

export default function CreateInscription() {
  const data = useLoaderData<typeof loader>()
  const { maxFileSize } = useRootContext()
  const operations = useInscriptionOperations()
  const isLedger = useIsLedger()

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
  const collectionHash = watch('collection')
  const selectedCollection = data.collections.find(
    (c) => c.transaction.hash === collectionHash,
  )

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'newTraits',
  })

  const { data: collection } = useCollection(selectedCollection?.id ?? 0)
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
            rules={{ pattern: /^[a-zA-Z0-9-. ]+$/ }}
            render={({
              field: { name, onChange, value, ref, onBlur, disabled },
            }) => (
              <Autocomplete
                key={trait}
                error={errors['traits']?.[trait] != null}
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
  const { dialogRef, value, showDialog } = useDialogWithValue<TxInscription>()

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

    let traits: inscription.Trait[] = []
    if (data.traits) {
      traits = Object.entries(data.traits).map(([trait_type, value]) => ({
        trait_type,
        value,
      }))
    }

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
    <div className="flex flex-col items-center w-full">
      <Form onSubmit={onSubmit} className="flex flex-col mt-4">
        {isLedger && <InscribingNotSupportedWithLedger />}

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
            <strong>Create an inscription</strong>

            <p className="mt-2">
              Inscriptions allow you to permanently write arbitrary data to the
              blockchain. The maximum size of an inscription is currently{' '}
              {maxFileSize / 1000}kb.
            </p>

            <Name register={register} name={name} error={errors.name} />

            <Description register={register} />

            <CollectionSelect
              collections={data.collections}
              error={errors.collection}
              register={register}
              title="Collection (optional)"
              tooltip="If you plan to inscribe more than 1 related inscription, consider grouping them into a collection for easier discoverability in the Asteroid marketplace"
            />

            <Divider className="mt-8 flex !gap-2">
              <span>Traits</span>
              <InfoTooltip
                className="whitespace-pre-wrap"
                message="Add as many traits as you'd like(i.e. hair color, strength, weaknesses, etc.)"
              />
            </Divider>

            {traitsMap && traitsComponents}

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

            {isLedger ? (
              <Button type="button" className="mt-4">
                Inscribing is not supported when using Ledger
              </Button>
            ) : operations ? (
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
        </div>
      </Form>
      <TxDialog
        ref={dialogRef}
        txInscription={value}
        resultLink={(txHash) => `/app/inscription/${txHash}`}
        resultCTA="View inscription"
        onSuccess={() => {
          reset()
          setFileName(null)
        }}
      />
    </div>
  )
}
