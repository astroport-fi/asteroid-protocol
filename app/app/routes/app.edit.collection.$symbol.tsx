import type { CollectionMetadata, TxInscription } from '@asteroid-protocol/sdk'
import { CheckIcon } from '@heroicons/react/20/solid'
import { LoaderFunctionArgs, json } from '@remix-run/cloudflare'
import { useLoaderData } from '@remix-run/react'
import { Button, Form } from 'react-daisyui'
import { useForm } from 'react-hook-form'
import { AsteroidClient } from '~/api/client'
import {
  Description,
  Discord,
  PaymentAddress,
  RoyaltyPercentage,
  Telegram,
  Twitter,
  UpdateFormData,
  Website,
} from '~/components/collection-form/Inputs'
import TxDialog from '~/components/dialogs/TxDialog'
import { Wallet } from '~/components/wallet/Wallet'
import { useDialogWithValue } from '~/hooks/useDialog'
import { useInscriptionOperations } from '~/hooks/useOperations'

export async function loader({ context, params }: LoaderFunctionArgs) {
  if (!params.symbol) {
    throw new Response(null, {
      status: 404,
      statusText: 'Not Found',
    })
  }

  const asteroidClient = new AsteroidClient(context.cloudflare.env.ASTEROID_API)
  const collection = await asteroidClient.getCollection(params.symbol)

  return json(collection)
}

export default function UpdateCollection() {
  const data = useLoaderData<typeof loader>()
  const operations = useInscriptionOperations()

  // form
  const {
    register,
    handleSubmit,
    watch,
    control,
    formState: { errors },
  } = useForm<UpdateFormData>({
    defaultValues: {
      description: data.metadata.description,
      paymentAddress: data.metadata.payment_address,
      royaltyPercentage: data.metadata.royalty_percentage
        ? data.metadata.royalty_percentage * 100
        : undefined,
      website: data.metadata.website,
      twitter: data.metadata.twitter,
      telegram: data.metadata.telegram,
      discord: data.metadata.discord,
    },
  })
  const paymentAddress = watch('paymentAddress')

  // dialog
  const { dialogRef, value, showDialog } = useDialogWithValue<TxInscription>()

  const onSubmit = handleSubmit(async (formData) => {
    if (!operations) {
      console.warn('No address')
      return
    }

    const metadata: Partial<CollectionMetadata> = {}
    if (
      formData.description &&
      formData.description !== data.metadata.description
    ) {
      metadata.description = formData.description
    }
    if (formData.website && formData.website !== data.metadata.website) {
      metadata.website = formData.website
    }
    if (formData.twitter && formData.twitter !== data.metadata.twitter) {
      metadata.twitter = formData.twitter
    }
    if (formData.telegram && formData.telegram !== data.metadata.telegram) {
      metadata.telegram = formData.telegram
    }
    if (formData.discord && formData.discord !== data.metadata.discord) {
      metadata.discord = formData.discord
    }
    if (formData.royaltyPercentage) {
      const royaltyPercentage = formData.royaltyPercentage / 100
      if (royaltyPercentage !== data.metadata.royalty_percentage) {
        metadata.royalty_percentage = royaltyPercentage
      }
    }

    if (
      formData.paymentAddress &&
      formData.paymentAddress !== data.metadata.payment_address
    ) {
      metadata.payment_address = formData.paymentAddress
    }

    const txInscription = operations.updateCollection(
      data.transaction.hash,
      metadata,
    )

    showDialog(txInscription)
  })

  return (
    <div className="flex flex-col items-center w-full overflow-y-auto">
      <Form onSubmit={onSubmit} className="flex flex-row mt-4 w-full max-w-6xl">
        <div className="flex flex-1 flex-col">
          <h2 className="text-lg">Update {data.name} metadata</h2>

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

          {operations ? (
            <Button
              type="submit"
              color="primary"
              className="mt-4"
              startIcon={<CheckIcon className="size-5" />}
            >
              Update collection metadata
            </Button>
          ) : (
            <Wallet className="mt-4 btn-md w-full" color="primary" />
          )}
        </div>
      </Form>
      <TxDialog
        ref={dialogRef}
        txInscription={value}
        resultLink={`/app/collection/${data.symbol}`}
        resultCTA="View Collection"
      />
    </div>
  )
}
