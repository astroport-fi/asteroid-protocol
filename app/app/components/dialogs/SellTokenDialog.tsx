import { TxData } from '@asteroid-protocol/sdk'
import clsx from 'clsx'
import { forwardRef, useState } from 'react'
import { Alert, Button, Form, Input, Modal } from 'react-daisyui'
import { Controller, useForm } from 'react-hook-form'
import { NumericFormat } from 'react-number-format'
import useDialog from '~/hooks/useDialog'
import useForwardRef from '~/hooks/useForwardRef'
import { useMarketplaceOperations } from '~/hooks/useOperations'
import { Token } from '~/services/asteroid'
import TxDialog from './TxDialog'

interface Props {
  token: Token
}

type FormData = {
  amount: number
  ppt: number
}

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
    const [txData, setTxData] = useState<TxData | null>(null)

    const onSubmit = handleSubmit(async (data) => {
      if (!operations) {
        console.warn('No address')
        return
      }

      const txData = operations.listCFT20(
        token.ticker,
        data.amount,
        data.ppt,
        0.1,
        50,
      )

      setTxData(txData)

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
              <div className="form-control w-full">
                <Form.Label title="Amount to sell" htmlFor="amount" />
                <Controller
                  rules={{ required: true, pattern: /^[0-9]+$/ }}
                  control={control}
                  name="amount"
                  render={({
                    field: { name, onChange, value, ref, onBlur, disabled },
                  }) => (
                    <NumericFormat
                      className="w-full"
                      getInputRef={ref}
                      value={value}
                      onBlur={onBlur}
                      disabled={disabled}
                      id={name}
                      name={name}
                      onValueChange={(v) =>
                        onChange(v.value ? parseInt(v.value) : '')
                      }
                      thousandSeparator
                      customInput={Input}
                      placeholder="Amount to sell"
                      color={errors.amount ? 'error' : undefined}
                    />
                  )}
                />

                <label className="label" htmlFor="amount">
                  <span
                    className={clsx('label-text-alt', {
                      ['text-error']: errors.amount != null,
                    })}
                  >
                    {errors.amount && 'Required'}
                  </span>
                </label>
              </div>
              <div className="form-control w-full ml-4">
                <Form.Label title="Price per token" htmlFor="ppt" />
                <Controller
                  rules={{ required: true, pattern: /^[0-9]+$/ }}
                  control={control}
                  name="ppt"
                  render={({
                    field: { name, onChange, value, ref, onBlur, disabled },
                  }) => (
                    <NumericFormat
                      className="w-full"
                      getInputRef={ref}
                      value={value}
                      onBlur={onBlur}
                      disabled={disabled}
                      id={name}
                      name={name}
                      onValueChange={(v) =>
                        onChange(v.value ? parseFloat(v.value) : '')
                      }
                      thousandSeparator
                      customInput={Input}
                      placeholder="Price per token"
                      color={errors.ppt ? 'error' : undefined}
                    />
                  )}
                />

                <label className="label" htmlFor="ppt">
                  <span
                    className={clsx('label-text-alt', {
                      ['text-error']: errors.ppt != null,
                    })}
                  >
                    {errors.ppt && 'Required'}
                  </span>
                </label>
              </div>
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
          <TxDialog txData={txData} ref={dialogRef} />
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
