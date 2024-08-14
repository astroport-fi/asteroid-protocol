import { LoaderFunctionArgs, json } from '@remix-run/cloudflare'
import { useLoaderData } from '@remix-run/react'
import { useState } from 'react'
import { Button, Form, Select } from 'react-daisyui'
import { useForm } from 'react-hook-form'
import { AsteroidClient } from '~/api/client'
import { CreatorLaunch } from '~/api/launchpad'
import { LaunchpadInscription } from '~/api/upload'
import InscriptionImage from '~/components/InscriptionImage'
import BulkUploadInscriptions from '~/components/dialogs/BulkUploadInscriptions'
import Modal from '~/components/dialogs/Modal'
import UploadInscription from '~/components/dialogs/UploadInscription'
import Label from '~/components/form/Label'
import useUploadedInscriptions from '~/hooks/uploader/useInscriptions'
import useDialog from '~/hooks/useDialog'
import { getAddress } from '~/utils/cookies'

export async function loader({ context, params, request }: LoaderFunctionArgs) {
  const address = await getAddress(request)

  const asteroidClient = new AsteroidClient(context.cloudflare.env.ASTEROID_API)
  let launchpadHash: string | undefined = undefined
  if (params.symbol) {
    launchpadHash = await asteroidClient.getLaunchpadHash(params.symbol)
  }

  let launches: CreatorLaunch[]
  if (address) {
    launches = await asteroidClient.getCreatorLaunches(address)
  } else {
    launches = []
  }

  return json({ launchpadHash: launchpadHash, launches })
}

interface FormData {
  launchpad: string
}

export function UploadedInscriptionBox({
  inscription,
}: {
  inscription: LaunchpadInscription
}) {
  return (
    <div className="flex flex-col flex-shrink-0 justify-between bg-base-200 rounded-xl group w-60">
      <InscriptionImage
        src={`https://asteroid-local.ams3.digitaloceanspaces.com/${inscription.launchpad_hash}/${inscription.name}`}
        isExplicit={false}
        className="h-60"
        containerClassName="rounded-t-xl"
      />
      <div className="bg-base-300 rounded-b-xl flex flex-col py-4">
        <div className="flex flex-col px-4">
          <strong className="text-nowrap overflow-hidden text-ellipsis">
            {inscription.name}
          </strong>
        </div>
      </div>
    </div>
  )
}

function UploadedInscriptions({ launchpadHash }: { launchpadHash: string }) {
  const { data } = useUploadedInscriptions(launchpadHash)

  return (
    <>
      {data &&
        data.map((inscription) => (
          <UploadedInscriptionBox
            key={inscription.id}
            inscription={inscription}
          />
        ))}
    </>
  )
}

export default function UploadInscriptionsPage() {
  const { launchpadHash, launches } = useLoaderData<typeof loader>()

  // dialog
  const { dialogRef, showDialog } = useDialog()
  const [multiple, setMultiple] = useState(false)

  // form
  const {
    register,
    watch,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ defaultValues: { launchpad: launchpadHash } })

  const selectedLaunchpadHash = watch('launchpad')
  const launchpadSelected =
    selectedLaunchpadHash && selectedLaunchpadHash !== '0'

  const onSubmit = handleSubmit(async () => {
    showDialog()
  })

  return (
    <div className="flex flex-col w-full items-center mt-4">
      <Form
        onSubmit={onSubmit}
        className="flex flex-col justify-center items-center w-full"
      >
        <div className="form-control mt-6">
          <Label title="Collection" htmlFor="launchpad" />
          <Select
            id="collection"
            className="w-full"
            color={errors.launchpad ? 'error' : undefined}
            {...register('launchpad', {
              required: true,
              minLength: 64,
            })}
          >
            <Select.Option value={0}>Select collection</Select.Option>
            {launches.map((launch) => (
              <Select.Option
                key={launch.transaction.hash}
                value={launch.transaction.hash}
              >
                {launch.collection.name}
              </Select.Option>
            ))}
          </Select>
        </div>

        <div className="flex flex-row gap-4 flex-wrap justify-center w-full mt-6">
          <div className="flex flex-col items-center border border-dashed rounded-xl px-6 py-8">
            <span className="text-xl text-center">Upload inscriptions</span>
            <Button
              className="mt-6"
              color="accent"
              onClick={() => setMultiple(false)}
            >
              One by one
            </Button>
            <span className="my-2">OR</span>
            <Button color="accent" onClick={() => setMultiple(true)}>
              Bulk upload
            </Button>
          </div>
          {launchpadSelected && (
            <UploadedInscriptions launchpadHash={selectedLaunchpadHash} />
          )}
        </div>
      </Form>
      <Modal ref={dialogRef} backdrop>
        {multiple ? (
          <BulkUploadInscriptions launchpadHash={selectedLaunchpadHash} />
        ) : (
          <UploadInscription launchpadHash={selectedLaunchpadHash} />
        )}
      </Modal>
    </div>
  )
}
