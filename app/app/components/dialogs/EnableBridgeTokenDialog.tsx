import { ExecuteMsg } from '@asteroid-protocol/sdk/contracts'
import { forwardRef, useMemo } from 'react'
import { Steps } from 'react-daisyui'
import { Token } from '~/api/token'
import { useRootContext } from '~/context/root'
import { useBridgeTokenSignatures } from '~/hooks/bridge/useBridgeSignatures'
import { useBridgeOperations } from '~/hooks/useOperations'
import useSubmitTx, {
  SubmitTxState,
  useExecuteBridgeMsg,
} from '~/hooks/useSubmitTx'
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
}

function CosmosTx({
  ticker,
  submitTxState,
}: {
  ticker: string
  submitTxState: SubmitTxState
}) {
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
          You are about to enable {ticker} token for bridging.
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

function NeutronTx({ token, signatures }: Props & { signatures: string[] }) {
  const { chainId } = useRootContext()

  const msg: ExecuteMsg = useMemo(() => {
    return {
      link_token: {
        signatures,
        source_chain_id: chainId,
        token: {
          decimals: token.decimals,
          image_url: token.content_path!,
          name: token.name,
          ticker: token.ticker,
        },
      },
    }
  }, [token, chainId, signatures])

  const funds = useMemo(() => {
    return [{ denom: 'untrn', amount: '1000000' }]
  }, [])

  const { chainFee, error, txHash, txState, sendTx } = useExecuteBridgeMsg(
    msg,
    '',
    'auto',
    funds,
  )

  return (
    <>
      <TxBody
        chainFee={chainFee}
        error={error}
        txHash={txHash}
        txState={txState}
      >
        <h2 className="text-xl font-semibold">
          Sign and submit transaction to Neutron
        </h2>
        <p className="mt-4">
          You are about to enable {token.ticker} token for bridging.
        </p>
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

const EnableTokenBridgeDialog = forwardRef<HTMLDialogElement, Props>(
  function EnableTokenBridgeDialog({ token }, ref) {
    const operations = useBridgeOperations()
    const { neutronBridgeContract, neutronChainId } = useRootContext()
    const txInscription = useMemo(() => {
      if (!operations) {
        return null
      }

      return operations.enable(
        token.ticker,
        neutronChainId,
        neutronBridgeContract,
      )
    }, [operations, token.ticker, neutronChainId, neutronBridgeContract])

    const submitTxState = useSubmitTx(txInscription)
    const signatures = useBridgeTokenSignatures(
      submitTxState.txHash,
      token.ticker,
    )

    const step = useMemo(() => {
      if (submitTxState.txHash !== '' && signatures.data) {
        return Step.Two
      }

      return Step.One
    }, [submitTxState.txHash, signatures.data])

    return (
      <Modal ref={ref} backdrop>
        <Modal.Header className="text-center">Enable Bridging</Modal.Header>
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
                <NeutronTx token={token} signatures={signatures.data} />
              ) : (
                <SWRStatus title="Bridge signatures" response={signatures} />
              )
            ) : (
              <CosmosTx submitTxState={submitTxState} ticker={token.ticker} />
            )}
          </div>
        </Modal.Body>
      </Modal>
    )
  },
)

export default EnableTokenBridgeDialog
