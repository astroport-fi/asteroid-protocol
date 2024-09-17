import { NFTMetadata, TxInscription } from '@asteroid-protocol/sdk'
import { CubeIcon, PencilSquareIcon } from '@heroicons/react/24/outline'
import { LoaderFunctionArgs, json } from '@remix-run/cloudflare'
import { Link, useLoaderData } from '@remix-run/react'
import clsx from 'clsx'
import { useState } from 'react'
import { Alert, Button, Form, Select } from 'react-daisyui'
import { useForm } from 'react-hook-form'
import { AsteroidClient } from '~/api/client'
import { CreatorLaunch } from '~/api/launchpad'
import { LaunchpadInscription } from '~/api/upload'
import InscriptionImage from '~/components/InscriptionImage'
import BulkUploadInscriptions from '~/components/dialogs/BulkUploadInscriptions'
import EditMetadata from '~/components/dialogs/EditMetadataDialog'
import Modal from '~/components/dialogs/Modal'
import TxDialog from '~/components/dialogs/TxDialog'
import UploadInscription from '~/components/dialogs/UploadInscription'
import { useRootContext } from '~/context/root'
import useInscriptionUrl from '~/hooks/uploader/useInscriptionUrl'
import useUploadedInscriptions from '~/hooks/uploader/useInscriptions'
import useDialog, { useDialogWithValue } from '~/hooks/useDialog'
import { useInscriptionOperations } from '~/hooks/useOperations'
import { getAddress } from '~/utils/cookies'
import { getDateFromUTCString } from '~/utils/date'

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
  collectionHash,
  inscription,
  folder,
  showMintButton,
  onEditClick,
  onMintClick,
}: {
  collectionHash: string
  inscription: LaunchpadInscription
  folder: string
  onEditClick: (inscription: LaunchpadInscription) => void
  onMintClick: (inscription: TxInscription) => void
  showMintButton: boolean
}) {
  const { assetsUrl } = useRootContext()
  const imageUrl = useInscriptionUrl(folder, inscription.name)
  const operations = useInscriptionOperations()

  return (
    <div className="flex flex-col flex-shrink-0 justify-between bg-base-200 rounded-xl group w-60">
      <InscriptionImage
        src={imageUrl}
        isExplicit={false}
        className="h-60"
        containerClassName="rounded-t-xl"
      />
      <div className="bg-base-300 rounded-b-xl flex flex-col py-4">
        <div className="flex flex-row justify-between items-center px-4">
          <strong className="text-nowrap overflow-hidden text-ellipsis">
            {inscription.name}
          </strong>
          <div className="flex">
            {showMintButton && (
              <Button
                shape="circle"
                color="ghost"
                size="sm"
                type="button"
                title="Pre-mint inscription"
                onClick={async () => {
                  if (!operations) {
                    console.warn('No operations')
                    return
                  }

                  const imageResponse = await fetch(imageUrl)
                  const imageData = await imageResponse.arrayBuffer()
                  const metadataUrl = `${assetsUrl}/${folder}/${inscription.inscription_number}_metadata.json?${Date.now()}`
                  const metadataResponse = await fetch(metadataUrl)
                  const metadataData =
                    await metadataResponse.json<NFTMetadata>()

                  const txInscription =
                    operations.inscribeCollectionInscription(
                      collectionHash,
                      new Uint8Array(imageData),
                      metadataData,
                    )
                  onMintClick(txInscription)
                }}
              >
                <CubeIcon className="size-4" />
              </Button>
            )}
            <Button
              shape="circle"
              color="ghost"
              size="sm"
              type="button"
              title="Edit metadata"
              onClick={() => onEditClick(inscription)}
            >
              <PencilSquareIcon className="size-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

function UploadedInscriptions({
  inscriptions,
  folder,
  collectionHash,
  showMintButton,
  onEditClick,
  onMintClick,
}: {
  inscriptions: LaunchpadInscription[]
  folder: string
  collectionHash: string
  onEditClick: (inscription: LaunchpadInscription) => void
  onMintClick: (inscription: TxInscription) => void
  showMintButton: boolean
}) {
  return (
    <>
      {inscriptions.map((inscription) => (
        <UploadedInscriptionBox
          key={inscription.id}
          inscription={inscription}
          folder={folder}
          collectionHash={collectionHash}
          onEditClick={onEditClick}
          onMintClick={onMintClick}
          showMintButton={showMintButton}
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
  const {
    dialogRef: editDialogRef,
    showDialog: showEditDialog,
    value: editInscription,
  } = useDialogWithValue<LaunchpadInscription>()
  const {
    dialogRef: txDialogRef,
    showDialog: showTxDialog,
    value: txInscription,
  } = useDialogWithValue<TxInscription>()

  // form
  const {
    register,
    watch,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ defaultValues: { launchpad: launchpadHash } })

  const selectedLaunchpadHash = watch('launchpad')

  const { data: inscriptionsRes } = useUploadedInscriptions(
    selectedLaunchpadHash ?? '',
  )

  const selectedLaunchpad = launches.find(
    (launch) => launch.transaction.hash === selectedLaunchpadHash,
  )

  const isActive =
    selectedLaunchpad &&
    (!selectedLaunchpad.start_date ||
      getDateFromUTCString(selectedLaunchpad.start_date) < new Date())

  const allUploaded =
    inscriptionsRes &&
    selectedLaunchpad &&
    selectedLaunchpad.max_supply &&
    inscriptionsRes.inscriptions.length >= selectedLaunchpad.max_supply

  const onSubmit = handleSubmit(async () => {
    showDialog()
  })

  return (
    <div className="flex flex-col w-full items-center overflow-y-scroll">
      <Form
        onSubmit={onSubmit}
        className="flex flex-col justify-center items-center w-full overflow-y-scroll"
      >
        <div
          className={clsx('flex flex-col justify-between items-center', {
            'mt-6': launchpadHash == undefined,
          })}
        >
          {launchpadHash == undefined && (
            <div className="form-control w-60">
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
          )}

          {selectedLaunchpad &&
            inscriptionsRes &&
            (allUploaded ? (
              <Alert className="border border-success mt-4 gap-1">
                All inscriptions have been uploaded. For more details about the
                launch, check your collection&apos;s
                <Link
                  className="underline"
                  to={`/app/launchpad/${selectedLaunchpad.collection.symbol}`}
                >
                  launch page
                </Link>
              </Alert>
            ) : (
              <Alert className="border border-accent mt-4 gap-1">
                {inscriptionsRes.inscriptions.length}{' '}
                {selectedLaunchpad.max_supply > 0 &&
                  `out of ${selectedLaunchpad.max_supply} `}
                inscriptions uploaded
              </Alert>
            ))}
        </div>

        <div className="flex flex-row gap-4 flex-wrap justify-center w-full mt-6 pb-8 overflow-y-scroll">
          {!allUploaded && (
            <div className="flex flex-col items-center border border-dashed rounded-xl px-6 py-8">
              <span className="text-xl text-center">Upload inscriptions</span>
              <Button
                className="mt-6"
                color="accent"
                disabled={!selectedLaunchpadHash}
                onClick={() => setMultiple(false)}
              >
                One by one
              </Button>
              <span className="my-2">OR</span>
              <Button
                color="accent"
                disabled={!selectedLaunchpadHash}
                onClick={() => setMultiple(true)}
              >
                Bulk upload
              </Button>
            </div>
          )}

          {inscriptionsRes && (
            <UploadedInscriptions
              collectionHash={selectedLaunchpad!.collection.transaction.hash}
              inscriptions={inscriptionsRes.inscriptions}
              folder={inscriptionsRes.folder}
              onEditClick={showEditDialog}
              showMintButton={isActive == false}
              onMintClick={showTxDialog}
            />
          )}
        </div>
      </Form>

      <Modal ref={dialogRef} backdrop>
        {multiple ? (
          <BulkUploadInscriptions
            launchpadHash={selectedLaunchpadHash}
            maxSupply={selectedLaunchpad!.max_supply}
          />
        ) : (
          <UploadInscription launchpadHash={selectedLaunchpadHash} />
        )}
      </Modal>

      <Modal ref={editDialogRef} backdrop>
        {editInscription && (
          <EditMetadata
            launchpadHash={selectedLaunchpadHash}
            folder={inscriptionsRes!.folder}
            tokenId={editInscription.inscription_number}
          />
        )}
      </Modal>

      <TxDialog
        ref={txDialogRef}
        txInscription={txInscription}
        resultLink={(txHash) => `/app/inscription/${txHash}`}
        resultCTA="View inscription"
      />
    </div>
  )
}
