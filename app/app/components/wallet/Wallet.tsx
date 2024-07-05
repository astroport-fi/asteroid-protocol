import { useNavigate } from '@remix-run/react'
import { useEffect, useState } from 'react'
import { useCookies } from 'react-cookie'
import { ButtonProps } from 'react-daisyui'
import { useRootContext } from '~/context/root'
import useChain from '~/hooks/wallet/useChain'
import useReloadWallet from '~/hooks/wallet/useReloadWallet'
import { USER_ADDRESS_COOKIE, serializeCookieValue } from '~/utils/cookies'
import Address from '../Address'
import {
  ButtonConnect,
  ButtonConnected,
  ButtonConnecting,
  ButtonNotExist,
  ButtonRejected,
} from './Connect'

export enum WalletStatus {
  Disconnected = 'Disconnected',
  Connecting = 'Connecting',
  Connected = 'Connected',
  NotExist = 'NotExist',
  Rejected = 'Rejected',
  Error = 'Error',
}

export function Wallet({
  className,
  color,
  chainName,
  onClick,
  reload = true,
}: {
  className?: string
  color?: ButtonProps['color']
  reload?: boolean
  chainName?: string
  onClick?: () => void
}) {
  const { chainName: cosmosHubChainName } = useRootContext()
  const { status, connect, openView, address } = useChain(
    chainName ?? cosmosHubChainName,
  )
  const [previousStatus, setPreviousStatus] = useState<WalletStatus | null>(
    null,
  )
  useReloadWallet()
  const navigate = useNavigate()

  const [cookies, setCookie, removeCookie] = useCookies([USER_ADDRESS_COOKIE])
  useEffect(() => {
    if (address) {
      const addressCookie = serializeCookieValue(address)
      if (cookies[USER_ADDRESS_COOKIE] !== addressCookie) {
        setCookie(USER_ADDRESS_COOKIE, addressCookie, {
          path: '/',
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 365,
        })
        if (reload) {
          navigate({ hash: '' }, { replace: true })
        }
      }
    } else if (
      status === WalletStatus.Disconnected &&
      previousStatus === WalletStatus.Connected
    ) {
      // @todo move this to a server action
      removeCookie(USER_ADDRESS_COOKIE, { path: '/', sameSite: 'lax' })
      if (reload) {
        navigate({ hash: '' }, { replace: true })
      }
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
    reload,
  ])

  const ConnectButton = {
    [WalletStatus.Connected]: (
      <ButtonConnected
        onClick={openView}
        text={<Address address={address ?? ''} start={6} />}
        className={className}
        color={color}
      />
    ),
    [WalletStatus.Connecting]: (
      <ButtonConnecting className={className} color={color} />
    ),
    [WalletStatus.Disconnected]: (
      <ButtonConnect
        onClick={() => {
          onClick?.()
          connect()
        }}
        className={className}
        color={color}
      />
    ),
    [WalletStatus.Error]: (
      <ButtonConnect onClick={openView} className={className} color={color} />
    ),
    [WalletStatus.Rejected]: (
      <ButtonRejected onClick={connect} className={className} color={color} />
    ),
    [WalletStatus.NotExist]: (
      <ButtonNotExist onClick={openView} className={className} color={color} />
    ),
  }[status] || (
    <ButtonConnect
      onClick={() => {
        onClick?.()
        connect()
      }}
      className={className}
      color={color}
    />
  )

  return ConnectButton
}
