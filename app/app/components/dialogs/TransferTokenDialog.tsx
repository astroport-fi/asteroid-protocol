import type { TxInscription } from '@asteroid-protocol/sdk'
import { forwardRef } from 'react'
import { Button, Form, Modal } from 'react-daisyui'
import { useForm } from 'react-hook-form'
import { Token } from '~/api/token'
import { useDialogWithValue } from '~/hooks/useDialog'
import useForwardRef from '~/hooks/useForwardRef'
import { useCFT20Operations } from '~/hooks/useOperations'
import CosmosAddressInput from '../form/CosmosAddressInput'
import NumericInput from '../form/NumericInput'
import TxDialog from './TxDialog'

interface Props {
  token: Token
}

type FormData = {
  amount: number
  destination: string
}

const TransferTokenDialog = forwardRef<HTMLDialogElement, Props>(
  function TransferTokenDialog({ token }, ref) {
    // form
    const {
      handleSubmit,
      control,
      register,
      watch,
      formState: { errors },
    } = useForm<FormData>({
      defaultValues: {
        amount: 10,
        destination: '',
      },
    })
    const destination = watch('destination')

    const operations = useCFT20Operations()
    const fRef = useForwardRef(ref)

    // dialog
    const { dialogRef, value, showDialog } = useDialogWithValue<TxInscription>()

    const onSubmit = handleSubmit(async (data) => {
      if (!operations) {
        console.warn('No address')
        return
      }

      const txInscription = operations.transfer(
        token.ticker,
        data.amount,
        data.destination,
      )

      fRef.current?.close()
      showDialog(txInscription)
    })

    return (
      <Modal ref={ref} backdrop>
        <Modal.Header className="text-center">
          Send {token.ticker} tokens
        </Modal.Header>
        <Modal.Body>
          <p>Transfers are final and can&apos;t be cancelled</p>
          <Form onSubmit={onSubmit} className="flex flex-col items-center mt-6">
            <NumericInput
              control={control}
              name="amount"
              error={errors.amount}
              title="Amount to transfer"
              required
            />
            <CosmosAddressInput
              register={register}
              name="destination"
              error={errors.destination}
              title="Destination address"
              value={destination}
            />

            <Button color="primary" type="submit" className="mt-4">
              Send now
            </Button>
          </Form>
          <TxDialog
            txInscription={value}
            ref={dialogRef}
            resultCTA="View transaction"
            resultLink={`/app/wallet/token/${token.ticker}`}
          />
        </Modal.Body>
        <Modal.Actions className="flex justify-center">
          <form method="dialog" className="flex flex-col">
            <Button className="no-underline" variant="link">
              Close
            </Button>
          </form>
        </Modal.Actions>
      </Modal>
    )
  },
)
export default TransferTokenDialog
