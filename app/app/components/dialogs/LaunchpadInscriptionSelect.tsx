import { NFTMetadata } from '@asteroid-protocol/sdk'
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/solid'
import clsx from 'clsx'
import { forwardRef, useState } from 'react'
import { Button } from 'react-daisyui'
import { twMerge } from 'tailwind-merge'
import { LaunchpadInscription } from '~/api/upload'
import useInscriptionUrl from '~/hooks/uploader/useInscriptionUrl'
import useMetadata from '~/hooks/uploader/useMetadata'
import useDialog from '~/hooks/useDialog'
import useForwardRef from '~/hooks/useForwardRef'
import DecimalText from '../DecimalText'
import Modal from './Modal'

function InscriptionListItem({
  inscription,
  folder,
  onSelect,
}: {
  inscription: LaunchpadInscription
  folder: string
  onSelect: (metadata: NFTMetadata) => void
}) {
  const metadata = useMetadata(folder, inscription.inscription_number)
  const imageUrl = useInscriptionUrl(folder, inscription.name)
  const hasDescription = !!metadata.data?.description

  return (
    <Button
      onClick={() => onSelect(metadata.data!)}
      size="lg"
      className={twMerge(
        clsx('justify-between items-center mb-4', {
          'h-24 min-h-24': hasDescription,
        }),
      )}
      loading={metadata.isLoading}
      fullWidth
    >
      {metadata.data && (
        <>
          <div className="flex items-center">
            <img
              alt={folder}
              src={imageUrl}
              className="size-14 rounded-full w-f"
            />
            <div className="flex flex-col justify-center ml-2">
              <span className="text-left">{metadata.data.name}</span>
              {hasDescription && (
                <p className="text-header-content mt-0.5 text-sm">
                  {metadata.data.description}
                </p>
              )}
              <DecimalText
                value={metadata.data.price!}
                suffix=" ATOM"
                className="mt-1 font-normal text-base text-left"
              />
            </div>
          </div>
          <ChevronRightIcon className="size-6" />
        </>
      )}
    </Button>
  )
}

interface Props {
  inscriptions: LaunchpadInscription[]
  folder: string
  title: string
  onSelect: (metadata: NFTMetadata) => void
}

const SelectInscriptionDialog = forwardRef<HTMLDialogElement, Props>(
  function SelectBridgeTokenDialog(
    { inscriptions, folder, title, onSelect },
    ref,
  ) {
    const fRef = useForwardRef(ref)

    return (
      <Modal ref={ref} backdrop>
        <Modal.Header className="text-center">
          <span>{title}</span>
        </Modal.Header>
        <Modal.Body className="flex flex-col items-center">
          {inscriptions.map((inscription) => (
            <InscriptionListItem
              folder={folder}
              inscription={inscription}
              onSelect={(metadata) => {
                onSelect(metadata)
                fRef.current?.close()
              }}
              key={inscription.id}
            />
          ))}
        </Modal.Body>
      </Modal>
    )
  },
)

export default function LaunchpadInscriptionSelect({
  folder,
  inscriptions,
  title = 'Select inscription',
  className,
  onSelect,
}: {
  folder: string
  inscriptions: LaunchpadInscription[]
  title?: string
  className?: string
  onSelect: (metadata: NFTMetadata) => void
}) {
  const { dialogRef: selectDialogRef, showDialog: showSelectDialog } =
    useDialog()
  const [selectedInscription, setSelectedInscription] =
    useState<NFTMetadata | null>(null)
  const imageUrl = useInscriptionUrl(
    folder,
    selectedInscription?.filename ?? '',
  )

  return (
    <div className={className}>
      <button
        type="button"
        onClick={() => showSelectDialog()}
        color="ghost"
        className="flex flex-row justify-between items-center bg-base-300 p-5 w-full rounded-full hover:cursor-pointer hover:bg-opacity-80"
      >
        <div className="flex items-center">
          {selectedInscription ? (
            <>
              <img
                alt={selectedInscription.name}
                src={imageUrl}
                className="size-14 rounded-full mr-1"
              />
              <div className="flex flex-col justify-center ml-2">
                <span className="text-left">{selectedInscription.name}</span>
                <p className="text-header-content mt-0.5">
                  {selectedInscription.description}
                </p>
                <DecimalText
                  value={selectedInscription.price!}
                  suffix=" ATOM"
                  className="mt-1 font-normal text-base text-left"
                />
              </div>
            </>
          ) : (
            <span>{title}</span>
          )}
        </div>
        <ChevronDownIcon className="size-6" />
      </button>
      <SelectInscriptionDialog
        ref={selectDialogRef}
        inscriptions={inscriptions}
        folder={folder}
        title={title}
        onSelect={(metadata) => {
          setSelectedInscription(metadata)
          onSelect(metadata)
        }}
      />
    </div>
  )
}
