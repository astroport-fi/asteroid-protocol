import { StdFee } from '@cosmjs/stargate'
import { QuestionMarkCircleIcon } from '@heroicons/react/24/outline'
import { PropsWithChildren } from 'react'
import { Divider, Skeleton, Tooltip } from 'react-daisyui'
import { NumericFormat } from 'react-number-format'
import { MetaprotocolFee } from '~/hooks/useSubmitTx'
import { getDecimalValue } from '~/utils/number'

interface FeeBreakdownProps {
  metaprotocolFee: MetaprotocolFee
  chainFee: StdFee | null
  operationTitle?: string
}

function Row({ children, title }: PropsWithChildren<{ title: string }>) {
  return (
    <div className="flex flex-row justify-between text-left">
      <strong className="mb-1 w-full font-semibold">{title}</strong>
      <div className="w-full flex items-center">{children}</div>
    </div>
  )
}

export function FeeBreakdown({
  chainFee,
  metaprotocolFee,
  operationTitle,
}: FeeBreakdownProps) {
  const chainFeeAmount = chainFee ? parseInt(chainFee.amount[0].amount) : 0

  return (
    <div className="flex flex-col w-full mt-8">
      <span className="text-md">Estimated fee breakdown</span>
      <div className="flex flex-col px-6 lg:px-16 mt-4">
        <Row title="Cosmos Hub">
          {chainFeeAmount > 0 ? (
            <NumericFormat
              value={getDecimalValue(chainFeeAmount, 6)}
              suffix=" ATOM"
              displayType="text"
              fixedDecimalScale
              decimalScale={6}
            />
          ) : (
            <Skeleton className="h-4 w-full" />
          )}
        </Row>
        <Row title="Metaprotocol">
          {chainFeeAmount > 0 ? (
            <NumericFormat
              value={getDecimalValue(metaprotocolFee.base, 6)}
              suffix=" ATOM"
              displayType="text"
              fixedDecimalScale
              decimalScale={6}
            />
          ) : (
            <Skeleton className="h-4 w-full" />
          )}
        </Row>
        {metaprotocolFee.operation > 0 && (
          <Row title={operationTitle ?? 'Operation'}>
            {chainFeeAmount > 0 ? (
              <NumericFormat
                value={getDecimalValue(metaprotocolFee.operation, 6)}
                suffix=" ATOM"
                displayType="text"
                fixedDecimalScale
                decimalScale={6}
              />
            ) : (
              <Skeleton className="h-4 w-full" />
            )}
          </Row>
        )}
        <Divider />
        <Row title="Estimated total">
          {chainFeeAmount > 0 ? (
            <>
              <NumericFormat
                value={getDecimalValue(
                  chainFeeAmount +
                    metaprotocolFee.base +
                    metaprotocolFee.operation,
                  6,
                )}
                suffix=" ATOM"
                displayType="text"
                fixedDecimalScale
                decimalScale={6}
              />{' '}
              <Tooltip
                position="left"
                message="You are required to complete a transfer of ATOM to generate an inscription. This self-transaction will send 0.000001 ATOM from the inscribing address back to the same address. Since the amount is refunded, it is not listed as a fee"
              >
                <QuestionMarkCircleIcon className="size-5 ml-1" />
              </Tooltip>
            </>
          ) : (
            <Skeleton className="h-4 w-full" />
          )}
        </Row>
      </div>
    </div>
  )
}
