import {
  RocketLaunchIcon,
  Square3Stack3DIcon,
} from '@heroicons/react/24/outline'
import { Link } from '@remix-run/react'

export default function CreateCollection() {
  return (
    <div className="flex flex-row items-center gap-8 justify-center">
      <div className="flex flex-col items-center border border-dashed rounded-3xl p-8 w-80">
        <span className="text-xl">Self-Launch Collection</span>
        <Square3Stack3DIcon className="size-20 mt-4" />
        <Link className="btn btn-primary mt-4" to="/app/create/collection/mint">
          Create Collection
        </Link>
      </div>
      <span>OR</span>
      <div className="flex flex-col items-center border border-dashed rounded-3xl p-8 w-80">
        <span className="text-xl">Create Public Launchpad</span>
        <RocketLaunchIcon className="size-20 mt-4" />
        <Link
          className="btn btn-primary mt-4"
          to="/app/create/launch/collection"
        >
          Create Launchpad
        </Link>
      </div>
    </div>
  )
}
