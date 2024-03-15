import type { TxInscription } from '@asteroid-protocol/sdk'
import { forwardRef } from 'react'
import { Alert, Button, Form, Modal } from 'react-daisyui'
import { useForm } from 'react-hook-form'
import { NumericFormat } from 'react-number-format'
import { MIN_DEPOSIT_PERCENT, TIMEOUT_BLOCKS } from '~/constants'
import { useDialogWithValue } from '~/hooks/useDialog'
import useForwardRef from '~/hooks/useForwardRef'
import { useMarketplaceOperations } from '~/hooks/useOperations'
import { getDecimalValue } from '~/utils/number'
import NumericInput from '../form/NumericInput'
import { Wallet } from '../wallet/Wallet'
import TxDialog from './TxDialog'

interface Props {
  ticker: string
  tokenAmount: number
  lastPrice: number
}

type FormData = {
  amount: number
  ppt: number
}

const SellTokenDialog = forwardRef<HTMLDialogElement, Props>(
  function SellTokenDialog({ ticker, tokenAmount, lastPrice }, ref) {
    // form
    const {
      handleSubmit,
      control,
      watch,
      formState: { errors },
    } = useForm<FormData>({
      defaultValues: {
        amount: 10,
        ppt: lastPrice > 0 ? lastPrice : 0.1,
      },
    })
    const amount = watch('amount')
    const ppt = watch('ppt')
    const notEnoughTokens = amount * 10e5 > tokenAmount

    const operations = useMarketplaceOperations()
    const fRef = useForwardRef(ref)

    // dialog
    const { dialogRef, value, showDialog } = useDialogWithValue<TxInscription>()

    const onSubmit = handleSubmit(async (data) => {
      if (!operations) {
        console.warn('No address')
        return
      }

      const txInscription = operations.listCFT20(
        ticker,
        data.amount,
        data.ppt,
        MIN_DEPOSIT_PERCENT,
        TIMEOUT_BLOCKS,
      )

      fRef.current?.close()
      showDialog(txInscription)
    })

    return (
      <Modal ref={ref} backdrop>
        <Modal.Header className="text-center">
          List {ticker} for sale
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
                required
              />

              <NumericInput
                control={control}
                name="ppt"
                error={errors.ppt}
                title="Price per token"
                className="ml-4"
                required
                isFloat
              />
            </div>
            {operations &&
              (notEnoughTokens ? (
                <Alert className="border border-warning">
                  <span>
                    You can&apos;t list more tokens than you have available.
                    Your balance is{' '}
                    <NumericFormat
                      value={getDecimalValue(tokenAmount, 6)}
                      suffix={` ${ticker}`}
                      thousandSeparator
                      displayType="text"
                      decimalScale={6}
                    />
                  </span>
                </Alert>
              ) : (
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
              ))}

            {operations ? (
              <Button
                color="primary"
                type="submit"
                className="mt-4"
                disabled={notEnoughTokens}
              >
                Confirm and list
              </Button>
            ) : (
              <Wallet
                className="mt-4 btn-md"
                onClick={() => fRef.current?.close()}
              />
            )}
          </Form>
          <TxDialog
            txInscription={value}
            ref={dialogRef}
            resultCTA="Back to market"
            resultLink={`/app/market/${ticker}`}
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
