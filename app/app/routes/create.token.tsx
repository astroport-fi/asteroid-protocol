import { CFT20Operations, TxData } from '@asteroid-protocol/sdk'
import { CheckIcon } from '@heroicons/react/20/solid'
import clsx from 'clsx'
import { useState } from 'react'
import { Button, FileInput, Form, Input, Link, Radio } from 'react-daisyui'
import { Controller, useForm } from 'react-hook-form'
import { NumericFormat } from 'react-number-format'
import TxDialog from '~/components/dialogs/TxDialog'
import { useRootContext } from '~/context/root'
import useAddress from '~/hooks/useAddress'
import useDialog from '~/hooks/useDialog'
import { loadImage, toBase64 } from '~/utils/file'

type FormData = {
  name: string
  ticker: string
  maxSupply: number
  mintLimit: number
  launch: 'immediately' | 'specific'
  launchDate: Date
  content: File[]
}

export default function CreateToken() {
  const { chainId, maxFileSize } = useRootContext()
  const address = useAddress()

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
  const { dialogRef, handleShow } = useDialog()
  const [txData, setTxData] = useState<TxData | null>(null)

  const onSubmit = handleSubmit(async (data) => {
    console.log(data)
    if (!address) {
      console.warn('No address')
      return
    }

    const file = data.content[0]
    let fileData: string | null = null
    const mime = file?.type ?? ''
    if (file) {
      fileData = await toBase64(file)
    }

    const operations = new CFT20Operations(chainId, address)
    const txData = operations.deploy(fileData ?? '', mime, {
      decimals: 6,
      maxSupply: data.maxSupply,
      mintLimit: data.mintLimit,
      name: data.name,
      ticker: data.ticker,
      openTime: data.launch === 'immediately' ? new Date() : data.launchDate,
    })

    setTxData(txData)

    handleShow()
  })

  return (
    <div>
      <p>
        The CFT-20 metaprotocol allows you to create, transfer, mint, buy and
        sell fungible tokens. When used in combination with the inscriptions
        metaprotocol, you can inscribe a logo for your token on the chain. The
        maximum size of a logo is currently {maxFileSize / 1000}kb.
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
                <span className="text-lg text-center">Logo</span>
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
                required: false,
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
              <span className="text-error">{errors.content.message}</span>
            )}
          </div>
        </div>
        <div className="flex flex-1 flex-col ml-8">
          <strong>Token information</strong>
          <p className="mt-2">Add detail to your inscription</p>

          <div className="form-control w-full mt-4">
            <label className="label" htmlFor="maxSupply">
              <span className="label-text">Name</span>
            </label>
            <Input
              placeholder="Name your token"
              color={errors.name ? 'error' : undefined}
              {...register('name', {
                required: true,
                minLength: 1,
                maxLength: 32,
                pattern: /^[a-zA-Z0-9-. ]+$/,
              })}
              maxLength={32}
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
            <label className="label" htmlFor="ticker">
              <span className="label-text">Ticker</span>
            </label>
            <Input
              placeholder="TOKEN"
              color={errors.ticker ? 'error' : undefined}
              {...register('ticker', {
                required: true,
                minLength: 1,
                maxLength: 10,
                pattern: /^[a-zA-Z0-9-.]+$/,
              })}
              maxLength={10}
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

          <div className="form-control w-full mt-4">
            <label className="label" htmlFor="maxSupply">
              <span className="label-text">Maximum supply</span>
            </label>
            <Controller
              rules={{ required: true, pattern: /^[0-9]+$/ }}
              control={control}
              name="maxSupply"
              render={({
                field: { name, onChange, value, ref, onBlur, disabled },
              }) => (
                <NumericFormat
                  getInputRef={ref}
                  value={value}
                  onBlur={onBlur}
                  disabled={disabled}
                  name={name}
                  onValueChange={(v) => onChange(parseInt(v.value))}
                  thousandSeparator
                  customInput={Input}
                  placeholder="Maximum supply"
                  color={errors.maxSupply ? 'error' : undefined}
                />
              )}
            />

            <label className="label" htmlFor="maxSupply">
              <span
                className={clsx('label-text-alt', {
                  ['text-error']: errors.maxSupply != null,
                })}
              >
                {errors.maxSupply && 'Required'}
              </span>
            </label>
          </div>

          <div className="form-control w-full mt-4">
            <label className="label" htmlFor="mintLimit">
              <span className="label-text">Per transaction mint limit</span>
            </label>

            <Controller
              rules={{ required: true, pattern: /^[0-9]+$/ }}
              control={control}
              name="mintLimit"
              render={({
                field: { name, onChange, value, ref, onBlur, disabled },
              }) => (
                <NumericFormat
                  getInputRef={ref}
                  value={value}
                  onBlur={onBlur}
                  disabled={disabled}
                  name={name}
                  onValueChange={(v) => onChange(parseInt(v.value))}
                  thousandSeparator
                  customInput={Input}
                  placeholder="Per transaction mint limit"
                  color={errors.mintLimit ? 'error' : undefined}
                />
              )}
            />

            <label className="label" htmlFor="mintLimit">
              <span
                className={clsx('label-text-alt', {
                  ['text-error']: errors.mintLimit != null,
                })}
              >
                {errors.mintLimit && 'Required'}
              </span>
            </label>
          </div>

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
              <Input
                type="datetime-local"
                className="w-full"
                {...register('launchDate', {
                  required: true,
                  valueAsDate: true,
                })}
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

          <Button
            type="submit"
            color="primary"
            className="mt-4"
            startIcon={<CheckIcon className="w-5 h-5" />}
          >
            Inscribe
          </Button>
        </div>
      </Form>
      <TxDialog ref={dialogRef} txData={txData} />
    </div>
  )
}
