import { MouseEventHandler } from 'react'
import {
  Button as DaisyButton,
  ButtonProps as DaisyButtonProps,
} from 'react-daisyui'

export type ButtonProps = {
  text?: string
  className?: string
  loading?: boolean
  disabled?: boolean
  color?: DaisyButtonProps['color']
  onClick?: MouseEventHandler<HTMLButtonElement>
}

function Button({
  text,
  loading,
  disabled,
  className,
  color,
  onClick,
}: ButtonProps) {
  return (
    <DaisyButton
      color={color ?? 'neutral'}
      size="sm"
      onClick={onClick}
      className={className}
      disabled={disabled}
      loading={loading}
    >
      {text}
    </DaisyButton>
  )
}

export const ButtonConnect = ({
  text = 'Connect Wallet',
  className,
  color,
  onClick,
}: ButtonProps) => (
  <Button text={text} className={className} color={color} onClick={onClick} />
)

export const ButtonConnected = ({
  text = 'My Wallet',
  className,
  color,
  onClick,
}: ButtonProps) => (
  <Button text={text} className={className} color={color} onClick={onClick} />
)

export const ButtonDisconnected = ({
  text = 'Connect Wallet',
  className,
  color,
  onClick,
}: ButtonProps) => (
  <Button text={text} className={className} color={color} onClick={onClick} />
)

export const ButtonConnecting = ({
  text = 'Connecting ...',
  className,
  color,
  loading = true,
}: ButtonProps) => (
  <Button text={text} className={className} color={color} loading={loading} />
)

export const ButtonRejected = ({
  text = 'Reconnect',
  className,
  color,
  onClick,
}: ButtonProps) => (
  <Button text={text} className={className} color={color} onClick={onClick} />
)

export const ButtonError = ({
  text = 'Change Wallet',
  className,
  color,
  onClick,
}: ButtonProps) => (
  <Button text={text} className={className} color={color} onClick={onClick} />
)

export const ButtonNotExist = ({
  text = 'Install Wallet',
  className,
  color,
  onClick,
}: ButtonProps) => (
  <Button text={text} className={className} color={color} onClick={onClick} />
)
