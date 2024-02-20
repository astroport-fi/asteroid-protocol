import { TxData } from '@asteroid-protocol/sdk'
import { QuestionMarkCircleIcon } from '@heroicons/react/24/outline'
import { Link } from '@remix-run/react'
import {
  PropsWithChildren,
  forwardRef,
  useCallback,
  useEffect,
  useState,
} from 'react'
import { Button, Divider, Modal, Tooltip } from 'react-daisyui'
import { NumericFormat } from 'react-number-format'
import useAddress from '~/hooks/useAddress'
import useAsteroidClient from '~/hooks/useAsteroidClient'
import useClient, { SigningClient } from '~/hooks/useClient'
import { AsteroidService } from '~/services/asteroid'
import { getDecimalValue } from '~/utils/number'
import TxLink from '../TxLink'

interface Props {
  txData: TxData | null
  resultCTA?: string
  resultLink?: string
}

enum TxState {
  Initial,
  Submit,
  Sign,
  SuccessOnchain,
  SuccessIndexer,
  SuccessInscribed,
  Failed,
}

interface CheckResult {
  status: TxState
  error?: string
}

function txErrorToText(error: string) {
  if (error.includes('inscription_content_hash')) {
    return 'Your inscription contains content already inscribed. Duplicates are not allowed.'
  }
  if (error.includes('order by id') && error.includes("doesn't exist")) {
    return 'The sell order has already been filled or removed'
  }

  return error
}

async function checkTransaction(
  client: SigningClient,
  asteroidClient: AsteroidService,
  txState: TxState,
  txHash: string,
): Promise<CheckResult | undefined> {
  if (txState == TxState.Submit) {
    const tx = await client.getTx(txHash)
    if (tx && tx.code == 0) {
      return { status: TxState.SuccessOnchain }
    }
  } else {
    // Transaction was found on chain, now check indexer
    const transactionStatus = await asteroidClient.getTransactionStatus(txHash)

    if (transactionStatus) {
      // Indexer has it, keep checking until statusMessage changes
      // to something else than pending
      if (transactionStatus.toLowerCase() == 'success') {
        return { status: TxState.SuccessInscribed }
      } else if (transactionStatus.toLowerCase().includes('error')) {
        // We hit an error
        return { status: TxState.Failed, error: transactionStatus }
      } else {
        return { status: TxState.SuccessIndexer }
      }
    }
  }
}

function useWaitForTx(txHash: string) {
  const [txState, setTxState] = useState<TxState>(TxState.Initial)
  const [error, setError] = useState<string | null>(null)
  const client = useClient()
  const asteroidClient = useAsteroidClient()

  useEffect(() => {
    if (
      !client ||
      !txHash ||
      txState == TxState.SuccessInscribed ||
      txState == TxState.Failed
    ) {
      return
    }

    // @todo repeat maximum 180 times
    const intervalId = setInterval(async () => {
      const res = await checkTransaction(
        client,
        asteroidClient,
        txState,
        txHash,
      )
      if (res) {
        setTxState(res.status)
        if (res.error) {
          setError(res.error)
        }
      }
    }, 1000)

    return () => clearInterval(intervalId)
  })

  return [txState, setTxState, error] as const
}

function Row({ children, title }: PropsWithChildren<{ title: string }>) {
  return (
    <div className="flex flex-row justify-between text-left">
      <strong className="mb-1 w-full font-semibold">{title}</strong>
      <div className="w-full flex items-center">{children}</div>
    </div>
  )
}

interface SuccessProps extends Props {
  txHash?: string
  txState: TxState
  txError: string | null
}

function TxStatus({
  resultCTA,
  resultLink,
  txHash,
  txState,
  txError,
}: SuccessProps) {
  let title = ''
  let description = ''
  let headerColor = 'text-base-content'

  if (txState == TxState.Failed) {
    headerColor = 'text-error'
    title = 'Inscription failed'
    description =
      'Your inscription was created on-chain, but failed to be added to Asteroid.'
  } else if (txState == TxState.SuccessInscribed) {
    headerColor = 'text-success'
    title = 'Transaction complete'
    description = 'Your inscription is now on-chain and viewable on Asteroid'
  } else if (
    txState == TxState.SuccessOnchain ||
    txState == TxState.SuccessIndexer
  ) {
    headerColor = 'text-info'
    title = 'Indexing'
    description =
      'Your inscription has been created on-chain, waiting for indexer'
  } else {
    title = 'Waiting for transaction'
    description =
      ' Your inscription has been submitted and waiting to be added to the next block'
  }

  return (
    <div className="flex flex-col items-center">
      <h2 className={`text-xl font-semibold ${headerColor}`}>{title}</h2>
      <p className="mt-4">{description}</p>
      {txState == TxState.Failed && txError && (
        <p className="text-error">{txErrorToText(txError)}</p>
      )}
      {txState == TxState.SuccessInscribed && (
        <Link
          className="btn btn-primary mt-8"
          to={resultLink ?? `/inscription/${txHash}`}
        >
          {resultCTA ?? 'View inscription'}
        </Link>
      )}
      {txHash && (
        <div className="flex flex-col bg-base-200 p-4 mt-4 rounded-xl">
          <strong>Transaction hash</strong>
          <span className="font-thin break-all mt-2">{txHash}</span>
          <TxLink className="mt-4" txHash={txHash} title="View on Mintscan" />
        </div>
      )}
    </div>
  )
}
interface EstimateProps extends Props {
  chainFee: number
}

function Estimate({ chainFee }: EstimateProps) {
  // @todo
  const [metaprotocolFee, setMetaprotocolFee] = useState(0)

  return (
    <div>
      <h2 className="text-xl font-semibold">Sign and submit transaction</h2>
      <p className="mt-4">
        You are about to inscribe permanently on the Cosmos Hub.
      </p>
      <span>
        This can <strong>not</strong>
        {` `}be undone.
      </span>
      <div className="mt-8">
        <span className="text-md">Estimated fee breakdown</span>
        <div className="flex flex-col px-16 mt-4">
          <Row title="Cosmos Hub">
            <NumericFormat
              value={getDecimalValue(chainFee, 6)}
              suffix=" ATOM"
              displayType="text"
              fixedDecimalScale
              decimalScale={6}
            />
          </Row>
          <Row title="Metaprotocol">
            <NumericFormat
              value={getDecimalValue(metaprotocolFee, 6)}
              suffix=" ATOM"
              displayType="text"
              fixedDecimalScale
              decimalScale={6}
            />
          </Row>
          <Divider />
          <Row title="Estimated total">
            <NumericFormat
              value={getDecimalValue(chainFee + metaprotocolFee, 6)}
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
          </Row>
        </div>
      </div>
    </div>
  )
}

function SignError() {
  return (
    <div className="text-warning">
      <h2 className="text-xl font-semibold">Unable to sign transaction</h2>
      <p className="mt-4">
        This may be a new account. Please send some tokens to this account
        first.
      </p>
      <span className="mt-4">
        You must sign and submit the transaction in order to inscribe content
      </span>
    </div>
  )
}

function EstimateError({ error }: { error: string }) {
  return (
    <div className="text-error">
      <h2 className="text-xl font-semibold">
        Unable to estimate transaction fees
      </h2>
      <p className="mt-4">Error details: {error}</p>
    </div>
  )
}

const TxDialog = forwardRef<HTMLDialogElement, Props>(function TxDialog(
  { txData, resultCTA, resultLink },
  ref,
) {
  const [retry, setRetry] = useState(0)
  const client = useClient(retry)
  const address = useAddress()
  const [txHash, setTxHash] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [chainFee, setChainFee] = useState(0)
  const [txState, setTxState, txError] = useWaitForTx(txHash)

  useEffect(() => {
    if (!txData || !client) {
      setError('invalid txData or client')
      return
    }

    client
      .estimate(txData)
      .then((res) => {
        setChainFee(res)
        setError(null)
      })
      .catch((err) => {
        setError((err as Error).message)
      })
  }, [txData, client, retry, chainFee])

  const sendTx = useCallback(async () => {
    if (!address) {
      setError('no address, connect wallet first')
      return
    }

    if (!client) {
      setError('invalid client')
      return
    }

    if (!txData) {
      setError('invalid txData')
      return
    }

    setTxState(TxState.Sign)

    try {
      const res = await client.signAndBroadcast(txData)

      if (res.code) {
        setError(`Transaction failed with error code: ${res.code}`)
        return
      }

      setTxState(TxState.Submit)
      setTxHash(res.transactionHash)
    } catch (err) {
      setError((err as Error).message)
      console.error(err)
    }
  }, [address, client, txData, setTxState])

  return (
    <Modal ref={ref}>
      <Modal.Body className="text-center">
        {error ? (
          chainFee ? (
            <SignError />
          ) : (
            <EstimateError error={error} />
          )
        ) : txHash ? (
          <TxStatus
            txData={txData}
            txHash={txHash}
            txState={txState}
            txError={txError}
            resultCTA={resultCTA}
            resultLink={resultLink}
          />
        ) : (
          <Estimate txData={txData} chainFee={chainFee} />
        )}
      </Modal.Body>
      <Modal.Actions className="flex justify-center">
        <form method="dialog" className="flex flex-col">
          {!txHash && !error && (
            <Button
              type="button"
              color="primary"
              className="mb-4"
              loading={txState != TxState.Initial}
              onClick={sendTx}
            >
              Continue
            </Button>
          )}
          {error && (
            <Button
              type="button"
              color="primary"
              className="mb-4"
              onClick={() => {
                if (chainFee) {
                  sendTx()
                  setError(null)
                } else {
                  setRetry(retry + 1)
                }
              }}
            >
              Retry
            </Button>
          )}
          <Button
            className="no-underline"
            variant="link"
            onClick={() => {
              setChainFee(0)
              setTxState(TxState.Initial)
              setTxHash('')
            }}
          >
            Close
          </Button>
        </form>
      </Modal.Actions>
    </Modal>
  )
})

export default TxDialog
