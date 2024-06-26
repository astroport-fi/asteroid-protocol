import { ExecuteMsg } from '@asteroid-protocol/sdk/contracts'
import { useEffect, useMemo } from 'react'
import { Loading } from 'react-daisyui'
import { Token } from '~/api/token'
import { useRootContext } from '~/context/root'
import useTokenHolding from '~/hooks/api/useTokenHolding'
import { useIbcFee } from '~/hooks/neutron/useFeeRefunder'
import { useNeutronAddress } from '~/hooks/useAddress'
import useAsteroidClient from '~/hooks/useAsteroidClient'
import { TxState, useExecuteBridgeMsg } from '~/hooks/useSubmitTx'
import { useTokenFactoryBalance } from '~/hooks/useTokenFactory'
import { toDecimalValue } from '~/utils/number'
import DecimalText from '../DecimalText'
import Actions from '../SubmitTx/Actions'
import { TxBody } from '../SubmitTx/Body'
import Modal from './Modal'

interface Props {
  denom: string
  amount: number
  destination: string
  token: Token
}

function Success({
  ticker,
  tokenId,
  destination,
}: {
  ticker: string
  tokenId: number
  destination: string
}) {
  const neutronAddress = useNeutronAddress()
  const tokenFactoryBalance = useTokenFactoryBalance(ticker, neutronAddress)
  const { data, isLoading } = useTokenHolding(tokenId, destination)

  return (
    <div className="flex flex-col items-center mt-4">
      <div className="mb-4 text-lg flex flex-col items-center">
        <span>New token balance in Neutron:</span>
        {tokenFactoryBalance == null ? (
          <Loading variant="spinner" size="md" />
        ) : (
          <DecimalText
            value={parseInt(tokenFactoryBalance.amount)}
            suffix={` ${ticker}`}
          />
        )}
      </div>
      <div className="mb-4 text-lg flex flex-col items-center">
        <span>New token balance in Cosmos Hub:</span>
        {isLoading ? (
          <Loading variant="spinner" size="md" />
        ) : (
          <DecimalText value={data!} suffix={` ${ticker}`} />
        )}
      </div>
    </div>
  )
}

function NeutronTx({ token, denom, amount, destination }: Props) {
  const { neutronChainName } = useRootContext()
  const msg = useMemo(() => {
    if (!amount) {
      return
    }
    return {
      send: {
        destination_addr: destination,
      },
    } as ExecuteMsg
  }, [destination, amount])

  const fee = useIbcFee()
  const funds = useMemo(() => {
    if (!amount || !fee) {
      return
    }
    return [
      { denom, amount: `${toDecimalValue(amount, token.decimals)}` },
      { denom: 'untrn', amount: `${fee}` },
    ]
  }, [denom, amount, token.decimals, fee])

  const { chainFee, error, txHash, txState, sendTx, setTxState } =
    useExecuteBridgeMsg(msg, '', 'auto', funds, TxState.SuccessOnchain)
  const {
    status: { lastKnownHeight },
  } = useRootContext()

  // check if the transaction was received by the bridge
  const asteroidClient = useAsteroidClient()
  useEffect(() => {
    if (txState != TxState.SuccessOnchain) {
      return
    }

    const intervalId = setInterval(async () => {
      const res = await asteroidClient.getReceivedBridgeHistory(
        lastKnownHeight,
        destination,
        token.id,
        toDecimalValue(amount, token.decimals),
      )

      if (res && res.amount) {
        setTxState(TxState.Success)
      }
    }, 1000)

    return () => clearInterval(intervalId)
  }, [
    txState,
    asteroidClient,
    amount,
    token,
    destination,
    lastKnownHeight,
    setTxState,
  ])

  return (
    <>
      <TxBody
        chainFee={chainFee}
        error={error}
        txHash={txHash}
        txState={txState}
      >
        <h2 className="text-xl font-semibold">
          Sign and submit bridge transaction on Neutron
        </h2>
      </TxBody>
      {txState === TxState.Success && (
        <Success
          ticker={token.ticker}
          tokenId={token.id}
          destination={destination}
        />
      )}
      <Modal.Actions className="flex justify-center">
        <Actions
          chainName={neutronChainName}
          txState={txState}
          txHash={txHash}
          error={error}
          onSubmit={sendTx}
          onClose={() => {}}
          onRetry={() => {}}
        />
      </Modal.Actions>
    </>
  )
}

function FromNeutronBridgeDialog({ token, denom, amount, destination }: Props) {
  return (
    <Modal.Body className="text-center">
      <div className="mt-8">
        <NeutronTx
          denom={denom}
          token={token}
          amount={amount}
          destination={destination}
        />
      </div>
    </Modal.Body>
  )
}

export default FromNeutronBridgeDialog
