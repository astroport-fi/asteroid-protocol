import {
  RocketLaunchIcon,
  Square3Stack3DIcon,
} from '@heroicons/react/24/outline'
import { Link } from '@remix-run/react'

export default function CreateCollection() {
  return (
    <div className="flex flex-row items-center gap-8 justify-center">
      <div className="flex flex-col items-center border border-dashed rounded-3xl p-8 w-80">
        <span className="text-xl">Private Launch</span>
        <Square3Stack3DIcon className="size-20 mt-4" />
        <p className="text-center mt-4 text-sm">
          With a private launch, you mint/publish your collection on-chain
          yourself. Optionally, you can then list individual pieces in your
          collection for sale at a pre-set price.
        </p>
        <Link
          className="btn btn-primary mt-4 w-full"
          to="/app/create/collection/mint"
        >
          Get started
        </Link>
      </div>
      <span>OR</span>
      <div className="flex flex-col items-center border border-dashed rounded-3xl p-8 w-80">
        <span className="text-xl">Public Launch</span>
        <RocketLaunchIcon className="size-20 mt-4" />
        <p className="text-center mt-4 text-sm">
          Public launches use the Asteroid Launchpad. Upload your images and
          metadata, then allow others to mint random pieces from your collection
        </p>
        <Link
          className="btn btn-primary mt-4 w-full"
          to="/app/create/launch/collection"
        >
          Get started
        </Link>
      </div>
    </div>
  )
}
