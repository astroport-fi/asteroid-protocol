import { Alert } from 'react-daisyui'
import { twMerge } from 'tailwind-merge'

export function NotAffiliatedWarning({ className }: { className: string }) {
  return (
    <Alert
      className={twMerge(
        'flex justify-center border border-warning text-center',
        className,
      )}
    >
      This collection links to the Asteroid Protocol landing page and/or X or
      Telegram accounts, but is not directly affiliated with protocol
      development.
      <br />
      As always, DYOR when interacting with permissionless networks.
    </Alert>
  )
}
