import type { TxInscription } from '@asteroid-protocol/sdk'
import { inscription } from '@asteroid-protocol/sdk/metaprotocol'
import { CheckIcon, PlusIcon } from '@heroicons/react/20/solid'
import { InformationCircleIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { LoaderFunctionArgs, json } from '@remix-run/cloudflare'
import { Link, useLoaderData } from '@remix-run/react'
import { useMemo } from 'react'
import { Alert, Button, Divider, Form, Input } from 'react-daisyui'
import { Controller, useFieldArray, useForm } from 'react-hook-form'
import { AsteroidClient } from '~/api/client'
import { Collection, CollectionTrait } from '~/api/collection'
import InfoTooltip from '~/components/InfoTooltip'
import InscriptionImage from '~/components/InscriptionImage'
import TxDialog from '~/components/dialogs/TxDialog'
import Autocomplete from '~/components/form/Autocomplete'
import { CollectionSelect } from '~/components/form/CollectionSelect'
import Label from '~/components/form/Label'
import { Wallet } from '~/components/wallet/Wallet'
import useCollection from '~/hooks/api/useCollection'
import { useDialogWithValue } from '~/hooks/useDialog'
import { useInscriptionOperations } from '~/hooks/useOperations'
import { getAddress } from '~/utils/cookies'
import { getTraitsMap } from '~/utils/traits'

export async function loader({ context, request, params }: LoaderFunctionArgs) {
  const address = await getAddress(request)
  if (!address) {
    return json({ collections: [] as Collection[], inscription: null })
  }

  if (!params.hash) {
    throw new Response(null, {
      status: 404,
      statusText: 'Not Found',
    })
  }

  const asteroidClient = new AsteroidClient(context.cloudflare.env.ASTEROID_API)

  const inscription = await asteroidClient.getInscription(params.hash, true)
  if (!inscription) {
    throw new Response(null, {
      status: 404,
      statusText: 'Not Found',
    })
  }

  const res = await asteroidClient.getCollections(0, 500, {
    creator: address,
  })

  return json({ collections: res.collections, inscription })
}

type FormData = {
  collection: string | null
  traits: Record<string, string>
  newTraits: inscription.Trait[]
}

export default function CreateInscription() {
  const { collections, inscription } = useLoaderData<typeof loader>()
  const operations = useInscriptionOperations()

  // form
  const {
    register,
    handleSubmit,
    watch,
    control,
    reset,
    formState: { errors },
  } = useForm<FormData>()
  const collectionHash = watch('collection')
  const selectedCollection = collections.find(
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

  // dialog
  const { dialogRef, value, showDialog } = useDialogWithValue<TxInscription>()

  const onSubmit = handleSubmit(async (data) => {
    if (!operations) {
      console.warn('No address')
      return
    }

    if (!inscription) {
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

    let header = ['id']
    let row = [inscription.transaction.hash]

    if (traits.length > 0) {
      const filteredTraits = traits.filter(
        (trait) => trait.trait_type && trait.value,
      )
      header = header.concat(filteredTraits.map((trait) => trait.trait_type))
      row = row.concat(filteredTraits.map((trait) => trait.value))
    }

    const metadata: inscription.MigrationData = {
      header,
      rows: [row],
    }

    if (data.collection && data.collection !== '0') {
      metadata.collection = data.collection
    }

    const txInscription = operations.migrate(metadata)
    showDialog(txInscription)
  })

  if (!inscription) {
    return <div>Not found</div>
  }

  if (inscription.version === 'v2' && inscription.collection != null) {
    return (
      <Alert icon={<InformationCircleIcon className="size-6 text-warning" />}>
        <div>
          <h3 className="font-bold">{inscription.name}</h3>
          <div className="text-xs">
            The inscription has been successfully migrated
          </div>
        </div>
        <Link
          to={`/app/inscription/${inscription.transaction.hash}`}
          className="link link-hover"
        >
          See inscription
        </Link>
      </Alert>
    )
  }

  return (
    <div className="flex flex-col items-center w-full">
      <h2 className="text-xl">Migrate an inscription</h2>

      <Form onSubmit={onSubmit} className="flex flex-row mt-8 max-w-7xl">
        <div className="flex flex-1 flex-col items-center">
          <InscriptionImage
            src={inscription.content_path}
            isExplicit={inscription.is_explicit}
            mime={inscription.mime}
            imageClassName="rounded-xl object-contain"
            className="max-w-2xl w-full"
          />
          <span className="text-center text-lg mt-2">{inscription.name}</span>
        </div>
        <div className="flex flex-1 flex-col ml-8">
          <p className="mt-2">
            Use this form to migrate any pre-existing inscription into a
            collection to take advantage of new collections-related features
            including royalties and rarity traits
          </p>
          <p>
            In order to migrate multiple inscriptions at once, please go to the
            <Link to="/app/migrate/inscriptions" className="ml-1 text-primary">
              Migrate Inscriptions via CSV
            </Link>{' '}
            form
          </p>

          <CollectionSelect
            collections={collections}
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
            <div
              key={item.id}
              className="flex  w-full justify-between gap-4 mb-2"
            >
              <div className="form-control w-full">
                <Label
                  title="Name"
                  htmlFor={`newTraits.${index}.trait_type`}
                  tooltip="A category for your trait (i.e. hair color)"
                />
                <Input
                  color={
                    errors['newTraits']?.[index]?.trait_type
                      ? 'error'
                      : undefined
                  }
                  id={`newTraits.${index}.trait_type`}
                  {...register(`newTraits.${index}.trait_type`, {
                    pattern: /^[a-zA-Z0-9- ]+$/,
                  })}
                />
              </div>
              <div className="form-control w-full">
                <Label
                  title="Value"
                  htmlFor={`newTraits.${index}.value`}
                  tooltip={`The trait's data (i.e. the "hair color" trait could have a value of "red" or "black")`}
                />
                <Input
                  color={
                    errors['newTraits']?.[index]?.value ? 'error' : undefined
                  }
                  id={`newTraits.${index}.value`}
                  {...register(`newTraits.${index}.value`, {
                    pattern: /^[a-zA-Z0-9-. ]+$/,
                  })}
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
        resultLink={`/app/inscription/${inscription.transaction.hash}`}
        resultCTA="View inscription"
        onSuccess={() => {
          reset()
        }}
      />
    </div>
  )
}
