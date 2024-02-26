import { useChain } from '@cosmos-kit/react'
import '@interchain-ui/react/styles'
import { useNavigate } from '@remix-run/react'
import { WalletStatus } from 'cosmos-kit'
import { useEffect, useState } from 'react'
import { useCookies } from 'react-cookie'
import { Alert, ButtonProps } from 'react-daisyui'
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

export function Wallet({
  className,
  color,
}: {
  className?: string
  color?: ButtonProps['color']
}) {
  const { chainName } = useRootContext()
  const { status, wallet, message, connect, openView, address } =
    useChain(chainName)
  const [previousStatus, setPreviousStatus] = useState<WalletStatus | null>(
    null,
  )
  const navigate = useNavigate()

  const [cookies, setCookie, removeCookie] = useCookies([USER_ADDRESS_COOKIE])
  useEffect(() => {
    if (address) {
      const addressCookie = serializeCookieValue(address)
      if (cookies[USER_ADDRESS_COOKIE] !== addressCookie) {
        setCookie(USER_ADDRESS_COOKIE, addressCookie, {
          path: '/',
          sameSite: 'lax',
        })
        navigate('/app/wallet', { replace: true })
      }
    } else if (
      status === WalletStatus.Disconnected &&
      previousStatus === WalletStatus.Connected
    ) {
      removeCookie(USER_ADDRESS_COOKIE, { path: '/' })
    }

    setPreviousStatus(status)
  }, [
    cookies,
    setCookie,
    navigate,
    removeCookie,
    address,
    status,
    previousStatus,
  ])

  const ConnectButton = {
    [WalletStatus.Connected]: (
      <ButtonConnected
        onClick={openView}
        text={getEllipsisTxt(address)}
        className={className}
        color={color}
      />
    ),
    [WalletStatus.Connecting]: (
      <ButtonConnecting className={className} color={color} />
    ),
    [WalletStatus.Disconnected]: (
      <ButtonDisconnected
        onClick={connect}
        className={className}
        color={color}
      />
    ),
    [WalletStatus.Error]: (
      <ButtonError onClick={openView} className={className} color={color} />
    ),
    [WalletStatus.Rejected]: (
      <ButtonRejected onClick={connect} className={className} color={color} />
    ),
    [WalletStatus.NotExist]: (
      <ButtonNotExist onClick={openView} className={className} color={color} />
    ),
  }[status] || (
    <ButtonConnect onClick={connect} className={className} color={color} />
  )

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
