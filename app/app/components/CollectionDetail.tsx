import { GlobeAltIcon } from '@heroicons/react/24/outline'
import { Link } from 'react-daisyui'
import { Collection } from '~/api/collection'
import InscriptionImage from './InscriptionImage'
import Twitter from './icons/twitter'

export default function CollectionDetailComponent({
  collection,
}: {
  collection: Collection
}) {
  return (
    <div className="flex p-5 pb-6  border-b border-b-neutral items-center">
      <InscriptionImage
        src={collection.content_path!}
        isExplicit={collection.is_explicit}
        className="rounded-t-xl size-20 rounded-full"
      />
      <div className="flex flex-col ml-4 mt-1 h-full">
        <h2 className="text-xl">{collection.name} collection</h2>
        <div className="flex mt-3">
          <Link
            href="https://twitter.com/asteroidxyz"
            title="Astroid Protocol on X"
            target="_blank"
          >
            <GlobeAltIcon className="size-5" />
          </Link>
          <Link
            href="https://twitter.com/asteroidxyz"
            title="Astroid Protocol on X"
            target="_blank"
            className="ml-3"
          >
            <Twitter className="size-5" />
          </Link>
        </div>
      </div>
    </div>
  )
}
