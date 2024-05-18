import { ChevronRightIcon } from '@heroicons/react/24/solid'
import { Link } from '@remix-run/react'
import { forwardRef, useState } from 'react'
import { Loading, Progress } from 'react-daisyui'
import { Token } from '~/api/token'
import useFindBridgeTokens from '~/hooks/api/useFindBridgeTokens'
import useForwardRef from '~/hooks/useForwardRef'
import { SearchInput } from '../form/SearchInput'
import Modal from './Modal'

interface Props {
  tokens: Token[]
}

function TokenListItem({
  token,
  bridgeEnabled: enabled,
  onClose,
}: {
  token: Token
  bridgeEnabled: boolean
  onClose: () => void
}) {
  return (
    <Link
      to={
        enabled
          ? `/app/bridge/${token.ticker}`
          : `/app/token/${token.ticker}?enableBridging`
      }
      target={enabled ? '_self' : '_blank'}
      rel="noreferrer"
      onClick={(e) => {
        if (enabled) {
          onClose()
          e.stopPropagation()
        }
      }}
      key={token.id}
      className="btn btn-block justify-between mb-4"
    >
      <div className="flex items-center">
        <img
          alt={token.name}
          src={token.content_path}
          className="size-6 rounded-full mr-1"
        />
        <span>{token.name}</span>
      </div>
      {enabled ? (
        <ChevronRightIcon className="size-6" />
      ) : (
        <span className="text-primary">Enable bridging</span>
      )}
    </Link>
  )
}

const SelectBridgeTokenDialog = forwardRef<HTMLDialogElement, Props>(
  function SelectBridgeTokenDialog({ tokens }, ref) {
    const fRef = useForwardRef(ref)
    const [search, setSearch] = useState<string>('')
    const { data, isLoading } = useFindBridgeTokens(search)

    return (
      <Modal ref={ref} backdrop>
        <Modal.Header className="text-center">
          <span>Select bridge token</span>
          <SearchInput
            className="mt-4"
            placeholder="Search by name or ticker"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </Modal.Header>
        <Modal.Body className="flex flex-col items-center">
          {isLoading ? (
            <Loading variant="dots" className="items-center" />
          ) : data ? (
            data.map((token) => (
              <TokenListItem
                token={token}
                bridgeEnabled={token.bridge_tokens[0] !== undefined}
                onClose={() => {
                  fRef.current?.close()
                }}
                key={token.id}
              />
            ))
          ) : (
            tokens.map((token) => (
              <TokenListItem
                token={token}
                bridgeEnabled={true}
                onClose={() => {
                  fRef.current?.close()
                }}
                key={token.id}
              />
            ))
          )}
        </Modal.Body>
      </Modal>
    )
  },
)
export default SelectBridgeTokenDialog
