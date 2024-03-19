import type { TxInscription } from '@asteroid-protocol/sdk'
import { CheckIcon } from '@heroicons/react/20/solid'
import clsx from 'clsx'
import { useState } from 'react'
import { Button, FileInput, Form, Input, Link, Radio } from 'react-daisyui'
import DatePicker from 'react-datepicker'
import { Controller, useForm } from 'react-hook-form'
import TxDialog from '~/components/dialogs/TxDialog'
import NumericInput from '~/components/form/NumericInput'
import { Wallet } from '~/components/wallet/Wallet'
import { useRootContext } from '~/context/root'
import { useDialogWithValue } from '~/hooks/useDialog'
import { useCFT20Operations } from '~/hooks/useOperations'
import { loadImage } from '~/utils/file'
import 'react-datepicker/dist/react-datepicker.css'

type FormData = {
  name: string
  ticker: string
  maxSupply: number
  mintLimit: number
  launch: 'immediately' | 'specific'
  launchDate: Date
  content: File[]
}

const NAME_MIN_LENGTH = 1
const NAME_MAX_LENGTH = 32
const TICKER_MIN_LENGTH = 1
const TICKER_MAX_LENGTH = 10

export default function CreateToken() {
  const { maxFileSize } = useRootContext()
  const operations = useCFT20Operations()

  // form
  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      maxSupply: 1000000,
      mintLimit: 1000,
      launch: 'immediately',
    },
  })
  const name = watch('name')
  const ticker = watch('ticker')
  const launch = watch('launch')

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
    const mime = file?.type ?? ''
    const fileBuffer = await file.arrayBuffer()
    const byteArray = new Uint8Array(fileBuffer)
    if (!byteArray.byteLength) {
      console.warn('No file data')
      return
    }

    const txInscription = operations.deploy(byteArray, mime, {
      decimals: 6,
      maxSupply: data.maxSupply,
      mintLimit: data.mintLimit,
      name: encodeURI(data.name.trim()),
      ticker: data.ticker.toUpperCase(),
      openTime: data.launch === 'immediately' ? new Date() : data.launchDate,
    })

    showDialog(txInscription)
  })

  return (
    <div>
      <Form onSubmit={onSubmit} className="flex flex-row mt-4">
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
                <span className="text-lg text-center">Token Logo</span>
                <span className="mt-4">Minimum dimensions</span>
                <span>250x250</span>
                <span className="mt-4">Maximum dimensions</span>
                <span>1024x1024</span>
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
                  if (!file) {
                    return
                  }

                  if (!file.type.startsWith('image/')) {
                    return 'Only image files are allowed for token logos'
                  }
                  if (file.size > maxFileSize) {
                    return `File size exceeds maximum allowed size of ${maxFileSize / 1000} kb`
                  }

                  const img = await loadImage(URL.createObjectURL(file))
                  if (!img) {
                    return 'Invalid image'
                  }

                  const height = img.naturalHeight
                  const width = img.naturalWidth

                  if (width != height) {
                    return 'Image must be square'
                  }

                  if (width < 250 || width > 1024) {
                    return 'Image must be square and between 250x250 and 1024x1024 pixels'
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
                  : 'Token logo is required'}
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-1 flex-col ml-8">
          <strong>Token information</strong>
          <p className="mt-2">
            The CFT-20 Tokens metaprotocol allows you to create, transfer, mint,
            buy and sell fungible tokens. When used in combination with the
            inscriptions metaprotocol, you can inscribe a logo for your token on
            the chain. The maximum size of a logo is currently{' '}
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
              CFT-20 metaprotocol
            </Link>
            documentation
          </p>

          <div className="form-control w-full mt-4">
            <Form.Label title="Name" htmlFor="name" />
            <Input
              id="name"
              placeholder="Name your token"
              color={errors.name ? 'error' : undefined}
              {...register('name', {
                required: true,
                minLength: NAME_MIN_LENGTH,
                maxLength: NAME_MAX_LENGTH,
                pattern: /^[a-zA-Z0-9-. ]+$/,
              })}
              maxLength={NAME_MAX_LENGTH}
              minLength={NAME_MIN_LENGTH}
            />
            <label className="label" htmlFor="name">
              <span
                className={clsx('label-text-alt', {
                  ['text-error']: errors.name != null,
                })}
              >
                {errors.name
                  ? 'Name is required and must be 1-32 characters long'
                  : '1 - 32 characters, alphanumeric only'}
              </span>
              <span className="label-text-alt">{name?.length ?? 0} / 32</span>
            </label>
          </div>

          <div className="form-control w-full mt-4">
            <Form.Label title="Ticker" htmlFor="ticker" />
            <Input
              placeholder="TOKEN"
              id="ticker"
              className="uppercase"
              color={errors.ticker ? 'error' : undefined}
              {...register('ticker', {
                required: true,
                minLength: TICKER_MIN_LENGTH,
                maxLength: TICKER_MAX_LENGTH,
                pattern: /^[a-zA-Z0-9-.]+$/,
              })}
              minLength={TICKER_MIN_LENGTH}
              maxLength={TICKER_MAX_LENGTH}
            />
            <label className="label" htmlFor="ticker">
              <span
                className={clsx('label-text-alt', {
                  ['text-error']: errors.ticker != null,
                })}
              >
                {errors.ticker
                  ? 'Ticker is required and must be 1 - 10 characters, alphanumeric only'
                  : '1 - 10 characters, alphanumeric only'}
              </span>
              <span className="label-text-alt">{ticker?.length ?? 0} / 10</span>
            </label>
          </div>

          <NumericInput
            control={control}
            error={errors.maxSupply}
            name="maxSupply"
            title="Maximum supply"
            className="mt-4"
            required
          />

          <NumericInput
            control={control}
            error={errors.mintLimit}
            name="mintLimit"
            title="Per transaction mint limit"
            className="mt-4"
            required
          />

          <div className="mt-4">
            <strong>Token launch</strong>
            <p>
              Set a launch date for your token. Any mints before this date will
              be ignored and not counted towards an address&apos; balance
            </p>
          </div>

          <Form.Label title="Launch immediately" className="mt-4">
            <Radio
              value="immediately"
              {...register('launch', { required: true })}
            />
          </Form.Label>

          <Form.Label title="Launch at a specific date and time">
            <Radio
              value="specific"
              {...register('launch', { required: true })}
            />
          </Form.Label>

          {launch === 'specific' && (
            <div className="flex flex-row w-full">
              <Controller
                rules={{ required: true }}
                control={control}
                name="launchDate"
                render={({
                  field: { name, onChange, value, ref, onBlur, disabled },
                }) => (
                  <DatePicker
                    name={name}
                    ref={ref}
                    disabled={disabled}
                    minDate={new Date()}
                    onBlur={onBlur}
                    className="input"
                    selected={value}
                    onChange={onChange}
                    timeInputLabel="Time:"
                    placeholderText="Click to select a launch date"
                    dateFormat="MM/dd/yyyy h:mm aa"
                    shouldCloseOnSelect={false}
                    showTimeInput
                    showTimeSelect
                    timeIntervals={5}
                  />
                )}
              />
            </div>
          )}

          <div className="mt-6">
            <strong>Mint page</strong>
            <p>
              We create a dedicated mint page for your token where you can send
              people
              <br />
              The link will be available after your token is created
            </p>
          </div>

          {operations ? (
            <Button
              type="submit"
              color="primary"
              className="mt-4"
              startIcon={<CheckIcon className="size-5" />}
            >
              Create token
            </Button>
          ) : (
            <Wallet className="mt-4 btn-md w-full" color="primary" />
          )}
        </div>
      </Form>
      <TxDialog
        ref={dialogRef}
        txInscription={value}
        resultLink={`/app/token/${ticker?.toUpperCase()}`}
        resultCTA="View Token"
      />
    </div>
  )
}
