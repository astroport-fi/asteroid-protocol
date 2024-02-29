import { WalletIcon } from '@heroicons/react/20/solid'
import { MouseEventHandler, ReactNode } from 'react'
import {
  Button as DaisyButton,
  ButtonProps as DaisyButtonProps,
} from 'react-daisyui'

export type ButtonProps = {
  text?: ReactNode
  className?: string
  loading?: boolean
  disabled?: boolean
  color?: DaisyButtonProps['color']
  icon?: React.ReactNode
  onClick?: MouseEventHandler<HTMLButtonElement>
}

function Button({
  text,
  loading,
  disabled,
  className,
  color,
  icon,
  onClick,
}: ButtonProps) {
  return (
    <DaisyButton
      startIcon={icon}
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
  <Button
    text={text}
    icon={<WalletIcon className="w-5" />}
    className={className}
    color={color}
    onClick={onClick}
  />
)

export const ButtonConnected = ({
  text = 'My Wallet',
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

export const ButtonNotExist = ({
  text = 'Install Wallet',
  className,
  color,
  onClick,
}: ButtonProps) => (
  <Button text={text} className={className} color={color} onClick={onClick} />
)
