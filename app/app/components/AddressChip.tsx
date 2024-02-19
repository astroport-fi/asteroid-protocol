import { UserCircleIcon } from '@heroicons/react/24/solid'
import { Link } from '@remix-run/react'
import Address from './Address'

export default function AddressChip({ address }: { address: string }) {
  return (
    <Link
      to={`/wallet/${address}`}
      className="flex flex-row items-center bg-base-200 w-fit pl-1 pr-3 py-1 rounded-full"
    >
      <UserCircleIcon className="w-6 h-6" />
      <span className="ml-2">
        <Address address={address} />
      </span>
    </Link>
  )
}
