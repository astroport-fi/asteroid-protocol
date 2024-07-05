import { UserCircleIcon } from '@heroicons/react/24/solid'
import { Link } from '@remix-run/react'
import useAddress from '~/hooks/wallet/useAddress'
import Address from './Address'

export default function AddressChip({ address }: { address: string }) {
  const currentAddress = useAddress()

  return (
    <Link
      to={`/app/wallet/${address}`}
      className="flex flex-row flex-nowrap items-center btn btn-neutral btn-circle btn-sm w-fit pl-1 pr-3"
    >
      <UserCircleIcon className="size-6" />
      {currentAddress === address ? 'You' : <Address address={address} />}
    </Link>
  )
}
