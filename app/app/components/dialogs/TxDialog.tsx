import { TxData } from '@asteroid-protocol/sdk'
import { forwardRef, useCallback, useState } from 'react'
import { Button, Link, Modal } from 'react-daisyui'
import { useRootContext } from '~/context/root'
import useAddress from '~/hooks/useAddress'
import useClient from '~/hooks/useClient'

interface Props {
  txData: TxData | null
}

const TxDialog = forwardRef<HTMLDialogElement, Props>(function TxDialog(
  { txData },
  ref,
) {
  const client = useClient()
  const { txExplorer } = useRootContext()
  const address = useAddress()

  const [sendingTx, setSendingTx] = useState(false)
  const [transactionHash, setTransactionHash] = useState('')
  const [error, setError] = useState('')

  const sendTx = useCallback(async () => {
    if (!address) {
      throw new Error('invalid address')
    }

    if (!client) {
      throw new Error('invalid client')
    }

    if (!txData) {
      throw new Error('invalid txData')
    }

    setSendingTx(true)

    try {
      const res = await client.signAndBroadcast(
        address,
        txData.messages,
        'auto',
        txData.memo,
        undefined,
        txData.nonCriticalExtensionOptions,
      )
      setTransactionHash(res.transactionHash)
    } catch (err) {
      setError((err as Error).message)
      console.error(err)
    }

    setSendingTx(false)
  }, [address, client, txData])

  return (
    <Modal ref={ref}>
      <Modal.Header className="font-bold">
        Sign and submit transaction
      </Modal.Header>
      <Modal.Body>
        <div>
          <Link target="_blank" href={`${txExplorer}${transactionHash}`}>
            {transactionHash}
          </Link>
          {error && <pre style={{ whiteSpace: 'pre-wrap' }}>{error}</pre>}
        </div>
      </Modal.Body>
      <Modal.Actions>
        <form method="dialog">
          <Button type="button" loading={sendingTx} onClick={sendTx}>
            Confirm
          </Button>
          <Button>Close</Button>
        </form>
      </Modal.Actions>
    </Modal>
  )
})

export default TxDialog
