import { TxInscription } from '@asteroid-protocol/sdk'
import { forwardRef, useState } from 'react'
import { Alert, Button, Form, Modal } from 'react-daisyui'
import { useForm } from 'react-hook-form'
import { NumericFormat } from 'react-number-format'
import useDialog from '~/hooks/useDialog'
import useForwardRef from '~/hooks/useForwardRef'
import { useMarketplaceOperations } from '~/hooks/useOperations'
import { Token } from '~/services/asteroid'
import NumericInput from '../form/NumericInput'
import TxDialog from './TxDialog'

interface Props {
  token: Token
}

type FormData = {
  amount: number
  ppt: number
}

const MIN_DEPOSIT_PERCENT = 0.1
const TIMEOUT_BLOCKS = 100

const SellTokenDialog = forwardRef<HTMLDialogElement, Props>(
  function SellTokenDialog({ token }, ref) {
    // form
    const {
      handleSubmit,
      control,
      watch,
      formState: { errors },
    } = useForm<FormData>({
      defaultValues: {
        amount: 10,
        ppt: 0.1,
      },
    })
    const amount = watch('amount')
    const ppt = watch('ppt')

    const operations = useMarketplaceOperations()
    const fRef = useForwardRef(ref)

    // dialog
    const { dialogRef, handleShow } = useDialog()
    const [txInscription, setTxInscription] = useState<TxInscription | null>(
      null,
    )

    const onSubmit = handleSubmit(async (data) => {
      if (!operations) {
        console.warn('No address')
        return
      }

      const txInscription = operations.listCFT20(
        token.ticker,
        data.amount,
        data.ppt,
        MIN_DEPOSIT_PERCENT,
        TIMEOUT_BLOCKS,
      )

      setTxInscription(txInscription)

      fRef.current?.close()
      handleShow()
    })

    return (
      <Modal ref={ref}>
        <Modal.Header className="text-center">
          List {token.ticker} for sale
        </Modal.Header>
        <Modal.Body>
          <p>This transaction will list your tokens for sale</p>
          <p>
            You&apos;ll only receive the ATOM from the sale should someone
            purchase them
          </p>
          <p className="mt-4">
            Sales are final and can&apos;t be refunded. You may cancel a listing
            at any time before a successful reservation
          </p>
          <Form onSubmit={onSubmit} className="flex flex-col items-center">
            <div className="flex flex-row mt-8">
              <NumericInput
                control={control}
                name="amount"
                error={errors.amount}
                title="Amount to sell"
              />

              <NumericInput
                control={control}
                name="ppt"
                error={errors.ppt}
                title="Price per token"
                className="ml-4"
                isFloat
              />
            </div>
            <Alert className="border border-info">
              <span>
                You will be listing your tokens for a total of{' '}
                <NumericFormat
                  value={amount * ppt}
                  suffix=" ATOM"
                  thousandSeparator
                  displayType="text"
                  decimalScale={6}
                />
              </span>
            </Alert>

            <Button color="primary" type="submit" className="mt-4">
              Confirm and list
            </Button>
          </Form>
          <TxDialog
            txInscription={txInscription}
            ref={dialogRef}
            resultCTA="Back to market"
            resultLink={`/market/${token.ticker}`}
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
export default SellTokenDialog
