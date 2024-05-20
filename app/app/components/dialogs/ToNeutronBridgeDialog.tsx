import { useMemo } from 'react'
import { Link, Steps } from 'react-daisyui'
import { Token } from '~/api/token'
import { ASTROPORT_ATOM_DENOM } from '~/constants'
import { useRootContext } from '~/context/root'
import { useBridgeHistorySignatures } from '~/hooks/bridge/useBridgeSignatures'
import { usePair } from '~/hooks/useAstroportClient'
import { useBridgeOperations } from '~/hooks/useOperations'
import useSubmitTx, {
  SubmitTxState,
  TxState,
  useExecuteBridgeMsg,
} from '~/hooks/useSubmitTx'
import { toDecimalValue } from '~/utils/number'
import Actions from '../SubmitTx/Actions'
import { InscriptionBody, TxBody } from '../SubmitTx/Body'
import { SWRStatus } from '../SubmitTx/TxStatus'
import Modal from './Modal'

enum Step {
  One,
  Two,
}

interface Props {
  token: Token
  denom: string
  amount: number
  destination: string
}

function CosmosTx({ submitTxState }: { submitTxState: SubmitTxState }) {
  const { chainFee, metaprotocolFee, error, txState, txHash, sendTx, retry } =
    submitTxState

  return (
    <>
      <InscriptionBody
        chainFee={chainFee}
        metaprotocolFee={metaprotocolFee}
        error={error}
        txHash={txHash}
        txState={txState}
      >
        <h2 className="text-xl font-semibold">
          Sign and submit bridge transaction
        </h2>
        <p className="mt-4">
          You are about to create a bridge inscription on the Cosmos Hub.
        </p>
      </InscriptionBody>
      <Modal.Actions className="flex justify-center">
        <Actions
          txState={txState}
          txHash={txHash}
          error={error}
          onSubmit={sendTx}
          onClose={() => {}}
          onRetry={retry}
        />
      </Modal.Actions>
    </>
  )
}

function Success({ denom }: { denom: string }) {
  const { data, isLoading } = usePair(denom, ASTROPORT_ATOM_DENOM)

  if (isLoading) {
    return
  }

  return (
    <div className="flex flex-col items-center mt-4">
      {data == null ? (
        <>
          <span className="text-lg">
            Create a pool for the token in Astroport
          </span>
          <Link
            className="btn btn-accent mt-4"
            target="_blank"
            href="https://app.astroport.fi/pools/create"
          >
            Create a pool
          </Link>
        </>
      ) : (
        <>
          <span className="text-lg">Provide liquidity</span>
          <Link
            className="btn btn-accent mt-4"
            target="_blank"
            href={`https://app.astroport.fi/pools/${data.contract_addr}/provide`}
          >
            Provide liquidity
          </Link>
        </>
      )}
    </div>
  )
}

function NeutronTx({
  token,
  denom,
  amount,
  destination,
  transactionHash,
  signatures,
}: Props & { transactionHash: string; signatures: string[] }) {
  const { chainId } = useRootContext()

  const msg = useMemo(() => {
    return {
      receive: {
        ticker: token.ticker,
        amount: `${toDecimalValue(amount, token.decimals)}`,
        destination_addr: destination,
        source_chain_id: chainId,
        transaction_hash: transactionHash,
        signatures,
      },
    }
  }, [amount, chainId, destination, signatures, token, transactionHash])

  const { chainFee, error, txHash, txState, sendTx } = useExecuteBridgeMsg(msg)

  return (
    <>
      <TxBody
        chainFee={chainFee}
        error={error}
        txHash={txHash}
        txState={txState}
      >
        <h2 className="text-xl font-semibold">
          Sign and submit bridge transaction to Neutron
        </h2>
      </TxBody>
      <Success denom={denom} />
      {txState === TxState.Success && <Success denom={denom} />}
      <Modal.Actions className="flex justify-center">
        <Actions
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

function ToNeutronBridgeDialog({ token, denom, amount, destination }: Props) {
  const operations = useBridgeOperations()
  const { neutronBridgeContract, neutronChainId } = useRootContext()
  const txInscription = useMemo(() => {
    if (!operations) {
      return null
    }

    return operations.send(
      token.ticker,
      amount,
      neutronChainId,
      neutronBridgeContract,
      destination,
    )
  }, [
    operations,
    token,
    amount,
    destination,
    neutronChainId,
    neutronBridgeContract,
  ])

  const submitTxState = useSubmitTx(txInscription)
  const signatures = useBridgeHistorySignatures(submitTxState.txHash)

  const step = useMemo(() => {
    if (submitTxState.txHash !== '' && signatures.data) {
      return Step.Two
    }

    return Step.One
  }, [submitTxState.txHash, signatures.data])

  return (
    <Modal.Body className="text-center">
      <Steps className="w-full">
        <Steps.Step color="primary">Cosmos Hub</Steps.Step>
        <Steps.Step color={step === Step.Two ? 'primary' : undefined}>
          Neutron
        </Steps.Step>
      </Steps>
      <div className="mt-8">
        {submitTxState.txHash !== '' ? (
          signatures.data ? (
            <NeutronTx
              token={token}
              denom={denom}
              amount={amount}
              destination={destination}
              transactionHash={submitTxState.txHash}
              signatures={signatures.data}
            />
          ) : (
            <SWRStatus title="Bridge signatures" response={signatures} />
          )
        ) : (
          <CosmosTx submitTxState={submitTxState} />
        )}
      </div>
    </Modal.Body>
  )
}

export default ToNeutronBridgeDialog
