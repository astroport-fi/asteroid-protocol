import { TxInscription } from '@asteroid-protocol/sdk'
import { launchpad } from '@asteroid-protocol/sdk/metaprotocol'
import { CheckIcon, PlusIcon, XMarkIcon } from '@heroicons/react/20/solid'
import { LoaderFunctionArgs, json } from '@remix-run/cloudflare'
import { useLoaderData, useParams } from '@remix-run/react'
import clsx from 'clsx'
import { format } from 'date-fns'
import React, { useState } from 'react'
import { Button, Divider, Form, Input, Radio, Textarea } from 'react-daisyui'
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
import {
  COSMOS_ADDRESS_REGEXP,
  NAME_MAX_LENGTH,
  NAME_MIN_LENGTH,
} from '~/constants'
import { useDialogWithValue } from '~/hooks/useDialog'
import { useLaunchpadOperations } from '~/hooks/useOperations'
import useIsLedger from '~/hooks/wallet/useIsLedger'
import { getAddress } from '~/utils/cookies'
import { toDecimalValue } from '~/utils/number'
import 'react-datepicker/dist/react-datepicker.css'

function convertLocalToUTCDate(date: Date) {
  return new Date(date.getTime() + date.getTimezoneOffset() * 60000)
}

function getUTCString(date: Date | undefined) {
  return date
    ? `${format(convertLocalToUTCDate(date), 'MM/dd/yyyy h:mm aa')} UTC`
    : ''
}

export async function loader({ context, request }: LoaderFunctionArgs) {
  const address = await getAddress(request)
  if (!address) {
    return json({ collections: [] })
  }

  const asteroidClient = new AsteroidClient(context.cloudflare.env.ASTEROID_API)
  const collections = await asteroidClient.getEmptyCollections(address)

  return json({ collections: collections })
}

enum Reveal {
  Immediately = 'immediately',
  MintedOut = 'mintedOut',
  SpecificDate = 'specificDate',
}

enum Supply {
  Fixed = 'fixed',
  Infinite = 'infinite',
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
  supplyKind: Supply
  supply?: number
  reveal: Reveal
  revealDate?: Date
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
  const [collectionTicker, setCollectionTicker] = useState<string>('')
  const { symbol } = useParams()
  const selectedHash = symbol
    ? data.collections.find((c) => c.symbol === symbol)?.transaction.hash
    : undefined

  // form
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset,
    watch,
  } = useForm<FormData>({
    defaultValues: {
      stages: [{}],
      reveal: Reveal.Immediately,
      collection: selectedHash,
      supplyKind: Supply.Fixed,
    },
  })

  const reveal = watch('reveal')
  const supplyKind = watch('supplyKind')
  const revealDate = watch('revealDate')
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

    const metadata: launchpad.LaunchMetadata = {
      supply: data.supply,
      stages,
      revealImmediately: true,
    }

    if (data.reveal === Reveal.MintedOut) {
      metadata.revealImmediately = false
    } else if (data.reveal === Reveal.SpecificDate) {
      metadata.revealImmediately = false
      metadata.revealDate = data.revealDate
    }

    const txInscription = operations.launch(data.collection, metadata)
    showDialog(txInscription)
  })

  return (
    <div className="flex flex-col items-center w-full overflow-y-scroll pb-8">
      <Form onSubmit={onSubmit} className="flex flex-col mt-4 w-full max-w-6xl">
        {isLedger && <InscribingNotSupportedWithLedger />}

        <div className="flex w-full flex-col">
          <strong>Set launch options</strong>

          <CollectionSelect
            collections={data.collections}
            error={errors.collection}
            register={register}
            link={'/app/create/launch/collection'}
            linkInNewTab={false}
            required
          />

          <div className="mt-8">
            <strong>Collection supply</strong>
          </div>

          <div className="flex items-center">
            <Radio
              value={Supply.Fixed}
              id="fixed"
              {...register('supplyKind', { required: true })}
            />
            <Form.Label
              htmlFor="fixed"
              title="Fixed supply"
              className="mt-1 ml-1"
            ></Form.Label>
          </div>

          {supplyKind == Supply.Fixed && (
            <NumericInput
              control={control}
              required
              error={errors.supply}
              name="supply"
              placeholder="Total supply"
              className="mb-2"
            />
          )}

          {/* <div className="flex items-center">
            <Radio
              value={Supply.Infinite}
              id="infinite"
              {...register('supplyKind', { required: true })}
            />
            <Form.Label
              htmlFor="infinite"
              title="Infinite supply"
              className="mt-1 ml-1"
            ></Form.Label>
          </div> */}

          <div className="mt-8">
            <strong>Inscriptions reveal</strong>
          </div>

          <div className="flex items-center">
            <Radio
              value={Reveal.Immediately}
              id="immediately"
              {...register('reveal', { required: true })}
            />
            <Form.Label
              htmlFor="immediately"
              title="Reveal with each mint"
              className="mt-1 ml-1"
            ></Form.Label>
          </div>

          <div className="flex items-center">
            <Radio
              value={Reveal.MintedOut}
              id="mintedOut"
              {...register('reveal', { required: true })}
            />
            <Form.Label
              htmlFor="mintedOut"
              title="Reveal after fully minted out or after 3 months"
              className="mt-1 ml-1"
            ></Form.Label>
          </div>

          <div className="flex items-center">
            <Radio
              value={Reveal.SpecificDate}
              id="specificDate"
              {...register('reveal', { required: true })}
            />
            <Form.Label
              htmlFor="specificDate"
              title="Reveal at a specific date and time"
              className="mt-1 ml-1"
            ></Form.Label>
          </div>

          {reveal == Reveal.SpecificDate && (
            <div className="flex flex-col w-full">
              <Controller
                rules={{ required: true }}
                control={control}
                name="revealDate"
                render={({
                  field: { name, onChange, value, ref, onBlur, disabled },
                }) => (
                  <DatePicker
                    selected={value}
                    onChange={onChange}
                    ref={(dateRef) => {
                      if (!dateRef) {
                        return
                      }
                      ref({
                        focus: dateRef.setFocus,
                      })
                    }}
                    name={name}
                    disabled={disabled}
                    minDate={new Date()}
                    onBlur={onBlur}
                    className={clsx('input input-bordered', {
                      'input-error': errors.revealDate,
                    })}
                    timeInputLabel="Time:"
                    required
                    placeholderText="Click to select a reveal date"
                    dateFormat="MM/dd/yyyy h:mm aa"
                    shouldCloseOnSelect={false}
                    showTimeInput
                    showTimeSelect
                    timeIntervals={5}
                  />
                )}
              />
              <span className="mt-2 ml-1 text-sm">
                {getUTCString(revealDate)}
              </span>
            </div>
          )}

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
                    maxLength={NAME_MAX_LENGTH}
                    minLength={NAME_MIN_LENGTH}
                    {...register(`stages.${index}.name`, {
                      minLength: NAME_MIN_LENGTH,
                      maxLength: NAME_MAX_LENGTH,
                    })}
                  />
                  <label className="label" htmlFor="name">
                    <span
                      className={clsx('label-text-alt', {
                        ['text-error']: errors['stages']?.[index]?.name != null,
                      })}
                    >
                      {errors['stages']?.[index]?.name
                        ? 'Name must be 3-32 characters long'
                        : '3 - 32 characters'}
                    </span>
                  </label>
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
                              ref={(dateRef) => {
                                if (!dateRef) {
                                  return
                                }
                                ref({
                                  focus: dateRef.setFocus,
                                })
                              }}
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
                    <ErrorLabel error={errors.stages?.[index]?.start} />
                    <span className="mt-2 ml-1 text-sm">
                      {getUTCString(stages[index].start)}
                    </span>
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
                              ref={(dateRef) => {
                                if (!dateRef) {
                                  return
                                }
                                ref({
                                  focus: dateRef.setFocus,
                                })
                              }}
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
                      <span className="mt-2 ml-1 text-sm">
                        {getUTCString(stages[index].finish)}
                      </span>
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
              Set collection launch options
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
          collectionTicker
            ? `/app/create/launch/${collectionTicker}/inscriptions`
            : '/app/create/launch/inscriptions'
        }
        resultCTA="Step 3: Upload inscriptions"
        onSuccess={() => {
          if (selectedCollection) {
            setCollectionTicker(selectedCollection.symbol)
          }
          reset()
        }}
      />
    </div>
  )
}
