import { TxInscription } from '@asteroid-protocol/sdk'
import { CheckIcon, PlusIcon, XMarkIcon } from '@heroicons/react/20/solid'
import { LoaderFunctionArgs, json } from '@remix-run/cloudflare'
import { Link, useLoaderData } from '@remix-run/react'
import React from 'react'
import { Button, Divider, Form, Input, Select, Textarea } from 'react-daisyui'
import DatePicker from 'react-datepicker'
import { Controller, useFieldArray, useForm } from 'react-hook-form'
import { clientOnly$ } from 'vite-env-only'
import { AsteroidClient } from '~/api/client'
import { InscribingNotSupportedWithLedger } from '~/components/alerts/InscribingNotSupportedWithLedger'
import TxDialog from '~/components/dialogs/TxDialog'
import Label from '~/components/form/Label'
import NumericInput from '~/components/form/NumericInput'
import { Wallet } from '~/components/wallet/Wallet'
import { useDialogWithValue } from '~/hooks/useDialog'
import { useInscriptionOperations } from '~/hooks/useOperations'
import useIsLedger from '~/hooks/wallet/useIsLedger'
import { getAddress } from '~/utils/cookies'
import 'react-datepicker/dist/react-datepicker.css'

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

interface Stage {
  name?: string
  description?: string
  start?: Date
  finish?: Date
  price?: number
  maxPerUser?: number
}

type FormData = {
  collection: string
  stages: Stage[]
}

export default function CreateCollectionLaunch() {
  const data = useLoaderData<typeof loader>()
  const operations = useInscriptionOperations() // @todo launch operations
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

    console.log('!!data', data)

    // txInscription = operations.inscribe(byteArray, metadata)

    // showDialog(txInscription)
  })

  return (
    <div className="flex flex-col items-center w-full">
      <Form onSubmit={onSubmit} className="flex flex-col mt-4 w-full">
        {isLedger && <InscribingNotSupportedWithLedger />}

        <div className="flex w-full flex-col mt-4 lg:mt-0 lg:ml-8">
          <strong>Create a collection launch</strong>

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
                {...register('collection', { required: true, minLength: 64 })}
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
                  <Label title="Name" htmlFor={`stages.${index}.name`} />
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
                    title="Description"
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
                  title="Price (ATOM)"
                  placeholder="Price per inscription"
                  isFloat
                />

                <NumericInput
                  control={control}
                  error={errors['stages']?.[index]?.maxPerUser}
                  name={`stages.${index}.maxPerUser`}
                  title="Maximum mints per user"
                  className="mt-4"
                />

                <div className="flex flex-row my-4">
                  <div className="flex flex-col w-full">
                    <Label
                      title="Start date & time"
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
                      title="Finish date & time"
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
                      {errors.stages?.[index]?.finish && (
                        <label className="label">
                          <span className="label-text-alt text-error">
                            {errors.stages[index].finish.message}
                          </span>
                        </label>
                      )}
                    </div>
                  </div>
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
        resultLink={(txHash) => `/app/inscription/${txHash}`}
        resultCTA="View inscription"
        onSuccess={() => {
          reset()
        }}
      />
    </div>
  )
}
