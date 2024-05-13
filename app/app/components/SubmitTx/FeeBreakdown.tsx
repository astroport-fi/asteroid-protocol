import { StdFee } from '@cosmjs/stargate'
import { QuestionMarkCircleIcon } from '@heroicons/react/24/outline'
import { PropsWithChildren } from 'react'
import { Divider, Skeleton, Tooltip } from 'react-daisyui'
import { NumericFormat } from 'react-number-format'
import { MetaprotocolFee } from '~/hooks/useSubmitTx'
import { getDecimalValue } from '~/utils/number'

interface FeeBreakdownProps {
  chainFee: StdFee | null
  additionalFee?: number
}

interface InscriptionFeeBreakdownProps extends FeeBreakdownProps {
  metaprotocolFee: MetaprotocolFee
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

export function TxFeeBreakdown({
  chainFee,
  additionalFee = 0,
  children,
}: PropsWithChildren<FeeBreakdownProps>) {
  let chainFeeAmount: number = 0
  let chainFeeDenom: string = 'ATOM'
  let isCosmosHub = true

  if (chainFee) {
    const coin = chainFee.amount[0]
    chainFeeAmount = parseInt(coin.amount)
    chainFeeDenom = coin.denom.substring(1).toUpperCase()
    isCosmosHub = chainFeeDenom === 'ATOM'
  }
  const suffix = ` ${chainFeeDenom}`

  return (
    <div className="flex flex-col w-full mt-8">
      <span className="text-md">Estimated fee breakdown</span>
      <div className="flex flex-col px-6 lg:px-16 mt-4">
        <Row title={isCosmosHub ? 'Cosmos Hub' : 'Chain fee'}>
          {chainFeeAmount > 0 ? (
            <NumericFormat
              value={getDecimalValue(chainFeeAmount, 6)}
              suffix={suffix}
              displayType="text"
              fixedDecimalScale
              decimalScale={6}
            />
          ) : (
            <Skeleton className="h-4 w-full" />
          )}
        </Row>
        {children}
        <Divider />
        <Row title="Estimated total">
          {chainFeeAmount > 0 ? (
            <>
              <NumericFormat
                value={getDecimalValue(chainFeeAmount + additionalFee, 6)}
                suffix={suffix}
                displayType="text"
                fixedDecimalScale
                decimalScale={6}
              />
              {isCosmosHub && (
                <Tooltip
                  position="left"
                  message="You are required to complete a transfer of ATOM to generate an inscription. This self-transaction will send 0.000001 ATOM from the inscribing address back to the same address. Since the amount is refunded, it is not listed as a fee"
                >
                  <QuestionMarkCircleIcon className="size-5 ml-1" />
                </Tooltip>
              )}
            </>
          ) : (
            <Skeleton className="h-4 w-full" />
          )}
        </Row>
      </div>
    </div>
  )
}

export function InscriptionFeeBreakdown({
  chainFee,
  metaprotocolFee,
  operationTitle,
}: InscriptionFeeBreakdownProps) {
  let chainFeeAmount: number = 0

  if (chainFee) {
    chainFeeAmount = parseInt(chainFee.amount[0].amount)
  }
  const suffix = ' ATOM'

  return (
    <TxFeeBreakdown
      chainFee={chainFee}
      additionalFee={metaprotocolFee.base + metaprotocolFee.operation}
    >
      <Row title="Metaprotocol">
        {chainFeeAmount > 0 ? (
          <NumericFormat
            value={getDecimalValue(metaprotocolFee.base, 6)}
            suffix={suffix}
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
              suffix={suffix}
              displayType="text"
              fixedDecimalScale
              decimalScale={6}
            />
          ) : (
            <Skeleton className="h-4 w-full" />
          )}
        </Row>
      )}
    </TxFeeBreakdown>
  )
}
