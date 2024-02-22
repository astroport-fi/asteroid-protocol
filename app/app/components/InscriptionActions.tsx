import { Button } from 'react-daisyui'
import useDialog from '~/hooks/useDialog'
import { Inscription } from '~/services/asteroid'
import SellInscriptionDialog from './dialogs/SellInscriptionDialog'
import TransferInscriptionDialog from './dialogs/TransferInscriptionDialog'

interface Props {
  inscription: Inscription
}

export function InscriptionActions({ inscription }: Props) {
  const { dialogRef: transferDialogRef, handleShow: showTransferDialog } =
    useDialog()
  const { dialogRef: sellDialogRef, handleShow: showSellDialog } = useDialog()

  return (
    <div className="flex flex-row">
      <Button color="primary" onClick={() => showTransferDialog()}>
        Send
      </Button>
      <Button className="ml-2" color="primary" onClick={() => showSellDialog()}>
        Sell
      </Button>
      <TransferInscriptionDialog
        inscription={inscription}
        ref={transferDialogRef}
      />
      <SellInscriptionDialog inscription={inscription} ref={sellDialogRef} />
    </div>
  )
}
