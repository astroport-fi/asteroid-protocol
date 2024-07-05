import { useMemo } from 'react'
import { Divider, Link, Loading, Steps } from 'react-daisyui'
import { Token } from '~/api/token'
import { ASTROPORT_ATOM_DENOM } from '~/constants'
import { useRootContext } from '~/context/root'
import { usePair } from '~/hooks/astroport/useAstroportClient'
import {
  useCreateAstroportPoolUrl,
  useProvideAstroportLiquidityUrl,
} from '~/hooks/astroport/useAstroportUrl'
import { useBridgeHistorySignatures } from '~/hooks/bridge/useBridgeSignatures'
import { useBridgeOperations } from '~/hooks/useOperations'
import useSubmitTx, {
  SubmitTxState,
  TxState,
  useExecuteBridgeMsg,
} from '~/hooks/useSubmitTx'
import { useTokenFactoryBalance } from '~/hooks/useTokenFactory'
import { useNeutronAddress } from '~/hooks/wallet/useAddress'
import { toDecimalValue } from '~/utils/number'
import DecimalText from '../DecimalText'
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
        <p className="mt-4">Create a bridging inscription on Cosmos Hub.</p>
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

function Success({ ticker, denom }: { ticker: string; denom: string }) {
  const { data } = usePair(denom, ASTROPORT_ATOM_DENOM)
  const neutronAddress = useNeutronAddress()
  const tokenFactoryBalance = useTokenFactoryBalance(ticker, neutronAddress)
  const createPoolUrl = useCreateAstroportPoolUrl(ticker)
  const provideLiquidityUrl = useProvideAstroportLiquidityUrl(
    data?.contract_addr ?? '',
  )

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
      {data == null ? (
        <>
          <Divider />
          <span className="text-lg">
            Create a pool for the token in Astroport
          </span>
          <Link
            className="btn btn-accent mt-4"
            target="_blank"
            href={createPoolUrl}
          >
            Create a pool
          </Link>
        </>
      ) : (
        <>
          <Divider />
          <span className="text-lg">Provide liquidity</span>
          <Link
            className="btn btn-accent mt-4"
            target="_blank"
            href={provideLiquidityUrl}
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
  const { neutronChainName, chainId } = useRootContext()

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
          Finalize your bridging transaction on Neutron
        </h2>
      </TxBody>
      {txState === TxState.Success && (
        <Success denom={denom} ticker={token.ticker} />
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

function ToNeutronBridgeDialog({
  token,
  denom,
  amount,
  destination,
  bridgeTxHash,
}: Props & { bridgeTxHash?: string }) {
  const operations = useBridgeOperations()
  const { neutronBridgeContract, neutronChainId } = useRootContext()
  const txInscription = useMemo(() => {
    if (!operations) {
      return null
    }

    return operations.send(
      token.ticker,
      toDecimalValue(amount, token.decimals),
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
  const signatures = useBridgeHistorySignatures(
    bridgeTxHash ?? submitTxState.txHash,
  )
  const hasTxHash =
    (bridgeTxHash != null && bridgeTxHash !== '') || submitTxState.txHash !== ''

  const step = useMemo(() => {
    if (bridgeTxHash && signatures.data) {
      return Step.Two
    }

    if (submitTxState.txHash !== '' && signatures.data) {
      return Step.Two
    }

    return Step.One
  }, [submitTxState.txHash, signatures.data, bridgeTxHash])

  return (
    <Modal.Body className="text-center">
      <Steps className="w-full">
        <Steps.Step color="primary">Cosmos Hub</Steps.Step>
        <Steps.Step color={step === Step.Two ? 'primary' : undefined}>
          Neutron
        </Steps.Step>
      </Steps>
      <div className="mt-8">
        {hasTxHash ? (
          signatures.data ? (
            <NeutronTx
              token={token}
              denom={denom}
              amount={amount}
              destination={destination}
              transactionHash={bridgeTxHash ?? submitTxState.txHash}
              signatures={signatures.data}
            />
          ) : (
            <SWRStatus
              title="Creating your bridging inscription"
              response={signatures}
            />
          )
        ) : (
          <CosmosTx submitTxState={submitTxState} />
        )}
      </div>
    </Modal.Body>
  )
}

export default ToNeutronBridgeDialog
