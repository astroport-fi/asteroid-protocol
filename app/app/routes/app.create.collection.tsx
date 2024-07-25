import type { CollectionMetadata, TxInscription } from '@asteroid-protocol/sdk'
import { CheckIcon } from '@heroicons/react/20/solid'
import { Link, useLocation } from '@remix-run/react'
import clsx from 'clsx'
import { useState } from 'react'
import {
  Button,
  Link as DaisyLink,
  FileInput,
  Form,
  Input,
} from 'react-daisyui'
import { useForm } from 'react-hook-form'
import InfoTooltip from '~/components/InfoTooltip'
import { InscribingNotSupportedWithLedger } from '~/components/alerts/InscribingNotSupportedWithLedger'
import {
  CreateFormData,
  Description,
  Discord,
  PaymentAddress,
  RoyaltyPercentage,
  Telegram,
  Twitter,
  Website,
} from '~/components/collection-form/Inputs'
import TxDialog from '~/components/dialogs/TxDialog'
import Label from '~/components/form/Label'
import { Wallet } from '~/components/wallet/Wallet'
import { useRootContext } from '~/context/root'
import { useDialogWithValue } from '~/hooks/useDialog'
import { useInscriptionOperations } from '~/hooks/useOperations'
import useIsLedger from '~/hooks/wallet/useIsLedger'
import { loadImage } from '~/utils/file'

const NAME_MIN_LENGTH = 1
const NAME_MAX_LENGTH = 32
const TICKER_MIN_LENGTH = 1
const TICKER_MAX_LENGTH = 10

export default function CreateCollection() {
  const { maxFileSize } = useRootContext()
  const operations = useInscriptionOperations()

  // form
  const {
    register,
    handleSubmit,
    watch,
    control,
    reset,
    formState: { errors },
  } = useForm<CreateFormData>()
  const name = watch('name')
  const ticker = watch('ticker')
  const paymentAddress = watch('paymentAddress')
  const [createdTicker, setCreatedTicker] = useState<string | null>(null)
  const isLedger = useIsLedger()

  const location = useLocation()
  const insideLaunchpad = location.pathname.startsWith('/app/create/launch')

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

    const metadata: CollectionMetadata = {
      name: data.name,
      mime: mime,
      symbol: data.ticker.toUpperCase(),
      description: data.description,
    }
    if (data.website) {
      metadata.website = data.website
    }
    if (data.twitter) {
      metadata.twitter = data.twitter
    }
    if (data.telegram) {
      metadata.telegram = data.telegram
    }
    if (data.discord) {
      metadata.discord = data.discord
    }
    if (data.royaltyPercentage) {
      metadata.royalty_percentage = data.royaltyPercentage / 100
    }

    if (data.paymentAddress) {
      metadata.payment_address = data.paymentAddress
    }

    const txInscription = operations.inscribeCollection(byteArray, metadata)

    showDialog(txInscription)
  })

  return (
    <div className={insideLaunchpad ? 'overflow-y-scroll' : ''}>
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

            <div
              className={clsx('flex flex-col', {
                ['bg-base-200 w-full max-w-md border border-neutral border-dashed rounded-3xl p-8']:
                  fileName == null,
              })}
            >
              {fileName ? (
                <span className="text-center">{fileName}</span>
              ) : (
                <>
                  <span className="flex items-center justify-center text-lg">
                    Collection Logo
                    <InfoTooltip
                      message={
                        'Can be a custom image\nor one of your favorite inscriptions\nfrom your collection'
                      }
                      className="ml-2 before:ml-[-5rem]"
                    />
                  </span>
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
                className="opacity-0 w-10"
                {...register('content', {
                  required: true,
                  validate: async (files) => {
                    const file = files[0]
                    if (!file) {
                      return
                    }

                    if (!file.type.startsWith('image/')) {
                      return 'Only image files are allowed for collection logos'
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
                    : 'Collection logo is required'}
                </span>
              )}
            </div>
          </div>
          <div className="flex flex-1 flex-col mt-4 lg:mt-0 lg:ml-8">
            <strong>Create a collection</strong>
            <p className="mt-2">
              Creating a collection is a two-step process. First, create a
              collection inscription using the form below. Then, you can add
              inscriptions to your collection on the{' '}
              <Link
                className="link link-hover"
                to="/app/create/inscription"
                target="_blank"
              >
                Create Inscription
              </Link>{' '}
              page. All information below will appear on your collection&apos;s
              landing page on{` `}
              <DaisyLink href="https://asteroidprotocol.io">
                asteroidprotocol.io
              </DaisyLink>
              . Note that collection inscriptions are non-transferrable.
            </p>

            <div className="form-control w-full mt-4">
              <Label
                title="Name"
                htmlFor="name"
                tooltip={`Your collection must\nhave a unique name`}
              />
              <Input
                id="name"
                placeholder="Name your collection"
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
              <Label
                title="Ticker"
                htmlFor="ticker"
                tooltip="Your collection must have a unique ticker, which will be used in collection's URL"
                tooltipClassName="before:ml-20"
              />

              <Input
                placeholder="NFT"
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
                <span className="label-text-alt">
                  {ticker?.length ?? 0} / 10
                </span>
              </label>
            </div>

            <RoyaltyPercentage control={control} errors={errors} />

            <PaymentAddress
              register={register}
              errors={errors}
              value={paymentAddress}
            />

            <Website register={register} errors={errors} />

            <Twitter register={register} errors={errors} />

            <Telegram register={register} errors={errors} />

            <Discord register={register} errors={errors} />

            <Description register={register} />

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
                Create collection
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
        resultLink={`/app/collection/${createdTicker?.toUpperCase()}`}
        resultCTA="View Collection"
        onSuccess={() => {
          setCreatedTicker(ticker)
          reset()
          setFileName(null)
        }}
      />
    </div>
  )
}
