import { MouseEventHandler } from 'react'
import { Button as DaisyButton } from 'react-daisyui'

export type ButtonProps = {
  text?: string
  loading?: boolean
  disabled?: boolean
  onClick?: MouseEventHandler<HTMLButtonElement>
}

export type ConnectProps = Pick<ButtonProps, 'text' | 'loading' | 'onClick'>

function noop() {}

export function Button({
  text,
  loading,
  disabled,
  onClick = noop,
}: ButtonProps) {
  return (
    <DaisyButton
      color="neutral"
      size="sm"
      onClick={onClick}
      disabled={disabled}
      loading={loading}
    >
      {text}
    </DaisyButton>
  )
}

export const ButtonConnect = ({
  text = 'Connect Wallet',
  onClick = noop,
}: ConnectProps) => <Button text={text} onClick={onClick} />

export const ButtonConnected = ({
  text = 'My Wallet',
  onClick = noop,
}: ConnectProps) => <Button text={text} onClick={onClick} />

export const ButtonDisconnected = ({
  text = 'Connect Wallet',
  onClick = noop,
}: ConnectProps) => <Button text={text} onClick={onClick} />

export const ButtonConnecting = ({
  text = 'Connecting ...',
  loading = true,
}: ConnectProps) => <Button text={text} loading={loading} />

export const ButtonRejected = ({
  text = 'Reconnect',
  onClick = noop,
}: ConnectProps) => <Button text={text} onClick={onClick} />

export const ButtonError = ({
  text = 'Change Wallet',
  onClick = noop,
}: ConnectProps) => <Button text={text} onClick={onClick} />

export const ButtonNotExist = ({
  text = 'Install Wallet',
  onClick = noop,
}: ConnectProps) => <Button text={text} onClick={onClick} />
