import { TxInscription } from '@asteroid-protocol/sdk'
import { launchpad } from '@asteroid-protocol/sdk/metaprotocol'
import { CheckIcon, PlusIcon, XMarkIcon } from '@heroicons/react/20/solid'
import { LoaderFunctionArgs, json } from '@remix-run/cloudflare'
import { useLoaderData } from '@remix-run/react'
import React from 'react'
import { Button, Divider, Form, Input, Textarea } from 'react-daisyui'
import DatePicker from 'react-datepicker'
import { Controller, useFieldArray, useForm } from 'react-hook-form'
import { clientOnly$ } from 'vite-env-only'
import { AsteroidClient } from '~/api/client'
import { InscribingNotSupportedWithLedger } from '~/components/alerts/InscribingNotSupportedWithLedger'
import TxDialog from '~/components/dialogs/TxDialog'
import { CollectionSelect } from '~/components/form/CollectionSelect'
import ErrorLabel from '~/components/form/ErrorLabel'
import Label from '~/components/form/Label'
import NumericInput from '~/components/form/NumericInput'
import { Wallet } from '~/components/wallet/Wallet'
import { COSMOS_ADDRESS_REGEXP } from '~/constants'
import { useDialogWithValue } from '~/hooks/useDialog'
import { useLaunchpadOperations } from '~/hooks/useOperations'
import useIsLedger from '~/hooks/wallet/useIsLedger'
import { getAddress } from '~/utils/cookies'
import { toDecimalValue } from '~/utils/number'
import 'react-datepicker/dist/react-datepicker.css'

export async function loader({ context, request }: LoaderFunctionArgs) {
  const address = await getAddress(request)
  if (!address) {
    return json({ collections: [] })
  }

  const asteroidClient = new AsteroidClient(context.cloudflare.env.ASTEROID_API)
  const collections = await asteroidClient.getEmptyCollections(address)

  return json({ collections: collections })
}

interface FormStage {
  name?: string
  description?: string
  start?: Date
  finish?: Date
  price?: number
  maxPerUser?: number
  whitelist?: string
}

type FormData = {
  collection: string
  supply?: number
  stages: FormStage[]
}

function parseWhitelist(whitelist: string): string[] {
  return whitelist.split(',').map((a) => a.trim())
}

function validateWhitelist(whitelist: string): boolean {
  return whitelist.split(',').every((a) => COSMOS_ADDRESS_REGEXP.test(a.trim()))
}

export default function CreateCollectionLaunch() {
  const data = useLoaderData<typeof loader>()
  const operations = useLaunchpadOperations()
  const isLedger = useIsLedger()

  // form
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset,
    watch,
  } = useForm<FormData>({ defaultValues: { stages: [{}] } })

  const collectionHash = watch('collection')
  const selectedCollection = data.collections.find(
    (c) => c.transaction.hash === collectionHash,
  )
  const stages = watch('stages')

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'stages',
  })

  // dialog
  const { dialogRef, value, showDialog } = useDialogWithValue<TxInscription>()

  const onSubmit = handleSubmit(async (data) => {
    if (!operations) {
      console.warn('No address')
      return
    }

    const stages: launchpad.MintStage[] = data.stages.map((formStage) => {
      let price = formStage.price
      if (price) {
        price = toDecimalValue(price, 6)
      }

      if (formStage.whitelist) {
        const whitelist = parseWhitelist(formStage.whitelist)
        return { ...formStage, price, whitelist }
      }
      return { ...formStage, price, whitelist: undefined }
    })

    const txInscription = operations.launch(data.collection, {
      supply: data.supply,
      stages,
      revealImmediately: true,
    })
    showDialog(txInscription)
  })

  return (
    <div className="flex flex-col items-center w-full overflow-y-scroll">
      <Form onSubmit={onSubmit} className="flex flex-col mt-4 w-full">
        {isLedger && <InscribingNotSupportedWithLedger />}

        <div className="flex w-full flex-col">
          <strong>Create a collection launch</strong>

          <CollectionSelect
            collections={data.collections}
            error={errors.collection}
            register={register}
            link={'/app/create/launch/collection'}
            linkInNewTab={false}
            required
          />

          <NumericInput
            control={control}
            required
            error={errors.supply}
            name="supply"
            title="Collection supply"
            placeholder="Total supply"
            className="mt-8"
          />

          {fields.map((item, index) => (
            <React.Fragment key={`stage-${index}`}>
              <Divider className="mt-8 flex !gap-2">
                <div className="flex flex-row items-center">
                  <span>Mint stage {index + 1}</span>
                  {index > 0 && (
                    <Button
                      type="button"
                      shape="circle"
                      color="error"
                      size="xs"
                      className="mx-2"
                      onClick={() => remove(index)}
                    >
                      <XMarkIcon className="size-5" />
                    </Button>
                  )}
                </div>
              </Divider>

              <div className="flex flex-col w-full justify-between gap-4 mb-2">
                <div className="form-control w-full">
                  <Label
                    title="Name (Optional)"
                    htmlFor={`stages.${index}.name`}
                  />
                  <Input
                    color={
                      errors['stages']?.[index]?.name ? 'error' : undefined
                    }
                    id={`stages.${index}.name`}
                    {...register(`stages.${index}.name`)}
                  />
                </div>

                <div className="form-control w-full">
                  <Label
                    title="Description (optional)"
                    htmlFor={`stages.${index}.description`}
                  />
                  <Textarea
                    id="description"
                    placeholder="Describe mint stage..."
                    rows={10}
                    {...register(`stages.${index}.description`, {
                      required: false,
                    })}
                  />
                </div>

                <NumericInput
                  control={control}
                  error={errors['stages']?.[index]?.price}
                  name={`stages.${index}.price`}
                  title="Price in ATOM (optional)"
                  placeholder="Price per inscription"
                  isFloat
                />

                <NumericInput
                  control={control}
                  error={errors['stages']?.[index]?.maxPerUser}
                  name={`stages.${index}.maxPerUser`}
                  title="Maximum mints per user (optional)"
                  className="mt-4"
                />

                <div className="flex flex-row my-4">
                  <div className="flex flex-col w-full">
                    <Label
                      title="Start date & time (optional)"
                      htmlFor={`stages.${index}.start`}
                    />
                    <div className="flex">
                      {clientOnly$(
                        <Controller
                          control={control}
                          name={`stages.${index}.start`}
                          render={({
                            field: {
                              name,
                              onChange,
                              value,
                              ref,
                              onBlur,
                              disabled,
                            },
                          }) => (
                            <DatePicker
                              name={name}
                              ref={ref}
                              disabled={disabled}
                              minDate={new Date()}
                              onBlur={onBlur}
                              className="input input-bordered"
                              selected={value}
                              onChange={onChange}
                              timeInputLabel="Time:"
                              placeholderText="Click to select a start date"
                              dateFormat="MM/dd/yyyy h:mm aa"
                              shouldCloseOnSelect={false}
                              showTimeInput
                              showTimeSelect
                              timeIntervals={5}
                            />
                          )}
                        />,
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col w-full items-start">
                    <Label
                      title="Finish date & time (optional)"
                      htmlFor={`stages.${index}.finish`}
                    />
                    <div className="flex flex-col">
                      {clientOnly$(
                        <Controller
                          control={control}
                          rules={{
                            validate: (v) => {
                              const start = stages[index].start
                              if (start && v && v <= start) {
                                return 'Finish date must be after start date'
                              }
                            },
                          }}
                          name={`stages.${index}.finish`}
                          render={({
                            field: {
                              name,
                              onChange,
                              value,
                              ref,
                              onBlur,
                              disabled,
                            },
                          }) => (
                            <DatePicker
                              name={name}
                              ref={ref}
                              disabled={disabled}
                              minDate={new Date()}
                              onBlur={onBlur}
                              className="input input-bordered"
                              selected={value}
                              onChange={onChange}
                              timeInputLabel="Time:"
                              placeholderText="Click to select a finish date"
                              dateFormat="MM/dd/yyyy h:mm aa"
                              shouldCloseOnSelect={false}
                              showTimeInput
                              showTimeSelect
                              timeIntervals={5}
                            />
                          )}
                        />,
                      )}
                      <ErrorLabel error={errors.stages?.[index]?.finish} />
                    </div>
                  </div>
                </div>

                <div className="form-control w-full">
                  <Label
                    title="Whitelist (optional)"
                    htmlFor={`stages.${index}.whitelist`}
                  />
                  <Textarea
                    id="whitelist"
                    placeholder="Comma separated list of addresses"
                    rows={10}
                    color={
                      errors.stages?.[index]?.whitelist ? 'error' : undefined
                    }
                    {...register(`stages.${index}.whitelist`, {
                      required: false,
                      validate: (v) => {
                        if (v && !validateWhitelist(v)) {
                          return 'Invalid address'
                        }
                      },
                    })}
                  />
                  <ErrorLabel error={errors.stages?.[index]?.whitelist} />
                </div>
              </div>
            </React.Fragment>
          ))}

          <Button
            color="accent"
            className="mt-4"
            startIcon={<PlusIcon className="size-5" />}
            type="button"
            onClick={() => append({})}
          >
            Add stage
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
              Create collection launch
            </Button>
          ) : (
            <Wallet className="mt-4 btn-md w-full" color="primary" />
          )}
        </div>
      </Form>
      <TxDialog
        ref={dialogRef}
        txInscription={value}
        resultLink={() =>
          `/app/create/launch/${selectedCollection!.symbol}/inscriptions`
        }
        resultCTA="Upload inscriptions"
        onSuccess={() => {
          reset()
        }}
      />
    </div>
  )
}
