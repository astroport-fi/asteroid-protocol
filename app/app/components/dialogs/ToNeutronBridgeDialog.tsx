import { useMemo } from 'react'
import { Steps } from 'react-daisyui'
import { Token } from '~/api/token'
import { useRootContext } from '~/context/root'
import { useBridgeHistorySignatures } from '~/hooks/useBridgeSignatures'
import { useBridgeOperations } from '~/hooks/useOperations'
import useSubmitTx, {
  SubmitTxState,
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

function NeutronTx({
  token,
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
  console.log(txHash, txState)

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
        {/* <p className="mt-4">
          You are about to create a bridge inscription on the Cosmos Hub.
        </p> */}
      </TxBody>
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

function ToNeutronBridgeDialog({ token, amount, destination }: Props) {
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
