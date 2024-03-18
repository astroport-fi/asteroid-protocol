import { Link } from '@remix-run/react'
import { Club } from '~/api/clubs'
import { Collection } from '~/api/collection'
import InscriptionImage from './InscriptionImage'

export function CollectionBox({ collection }: { collection: Collection }) {
  return (
    <Link
      className="flex flex-col justify-between bg-base-200 rounded-xl"
      to={`/app/collection/${collection.symbol}`}
    >
      <InscriptionImage
        src={collection.content_path!}
        isExplicit={collection.is_explicit}
        className="rounded-t-xl h-60"
      />
      <div className="bg-base-300 rounded-b-xl flex flex-col py-4">
        <div className="flex flex-col px-4">
          <strong className="text-nowrap overflow-hidden text-ellipsis">
            {collection.name}
          </strong>
        </div>
      </div>
    </Link>
  )
}

export function ClubBox({ club }: { club: Club }) {
  return (
    <Link
      className="flex flex-col justify-between bg-base-200 rounded-xl"
      to={`/app/inscriptions/${club.slug}`}
    >
      <span className="flex items-center justify-center w-full h-60 rounded-t-xl text-2xl font-bold">
        &lt; {club.id}
      </span>
      <div className="bg-base-300 rounded-b-xl flex flex-col py-4">
        <div className="flex flex-col px-4">
          <strong className="text-nowrap overflow-hidden text-ellipsis">
            {club.title}
          </strong>
        </div>
      </div>
    </Link>
  )
}

export default function Collections({
  collections,
}: {
  collections: Collection[]
}) {
  return (
    <div className="grid grid-cols-fill-56 gap-4 mt-8">
      {collections.map((collection) => (
        <CollectionBox key={collection.id} collection={collection} />
      ))}
    </div>
  )
}
