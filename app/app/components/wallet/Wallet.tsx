import { useChain } from '@cosmos-kit/react'
import '@interchain-ui/react/styles'
import { WalletStatus } from 'cosmos-kit'
import { useEffect, useState } from 'react'
import { useCookies } from 'react-cookie'
import { Alert } from 'react-daisyui'
import { useRootContext } from '~/context/root'
import { USER_ADDRESS_COOKIE, serializeCookieValue } from '~/utils/cookies'
import { getEllipsisTxt } from '~/utils/string'
import {
  ButtonConnect,
  ButtonConnected,
  ButtonConnecting,
  ButtonDisconnected,
  ButtonError,
  ButtonNotExist,
  ButtonRejected,
} from './Connect'

export function Wallet() {
  const { chainName } = useRootContext()
  const { status, wallet, message, connect, openView, address } =
    useChain(chainName)
  const [previousStatus, setPreviousStatus] = useState<WalletStatus | null>(
    null,
  )

  const [cookies, setCookie, removeCookie] = useCookies([USER_ADDRESS_COOKIE])
  useEffect(() => {
    if (address) {
      const addressCookie = serializeCookieValue(address)
      if (cookies[USER_ADDRESS_COOKIE] !== addressCookie) {
        setCookie(USER_ADDRESS_COOKIE, addressCookie, {
          path: '/',
          sameSite: 'lax',
        })
      }
    } else if (
      status === WalletStatus.Disconnected &&
      previousStatus === WalletStatus.Connected
    ) {
      removeCookie(USER_ADDRESS_COOKIE, { path: '/' })
    }

    setPreviousStatus(status)
  }, [cookies, setCookie, removeCookie, address, status, previousStatus])

  const ConnectButton = {
    [WalletStatus.Connected]: (
      <ButtonConnected onClick={openView} text={getEllipsisTxt(address)} />
    ),
    [WalletStatus.Connecting]: <ButtonConnecting />,
    [WalletStatus.Disconnected]: <ButtonDisconnected onClick={connect} />,
    [WalletStatus.Error]: <ButtonError onClick={openView} />,
    [WalletStatus.Rejected]: <ButtonRejected onClick={connect} />,
    [WalletStatus.NotExist]: <ButtonNotExist onClick={openView} />,
  }[status] || <ButtonConnect onClick={connect} />

  return (
    <div>
      {ConnectButton}
      {message &&
      [WalletStatus.Error, WalletStatus.Rejected].includes(status) ? (
        <Alert>{`${wallet?.prettyName}: ${message}`}</Alert>
      ) : null}
    </div>
  )
}
