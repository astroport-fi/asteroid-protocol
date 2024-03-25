import { Link } from '@remix-run/react'
import { Club } from '~/api/clubs'
import { Collection } from '~/api/collection'
import Grid from './Grid'
import InscriptionImage from './InscriptionImage'

export function CollectionBox({ collection }: { collection: Collection }) {
  return (
    <Link
      className="flex flex-col justify-between bg-base-200 rounded-xl group"
      to={`/app/collection/${collection.symbol}`}
    >
      <InscriptionImage
        src={collection.content_path!}
        isExplicit={collection.is_explicit}
        containerClassName="h-60 rounded-t-xl"
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
      className="flex flex-col justify-between bg-base-200 rounded-xl group"
      to={`/app/inscriptions/${club.slug}`}
    >
      <InscriptionImage
        src={club.image}
        containerClassName="h-60 rounded-t-xl"
      />

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
  className,
}: {
  collections: Collection[]
  className?: string
}) {
  return (
    <Grid className={className}>
      {collections.map((collection) => (
        <CollectionBox key={collection.id} collection={collection} />
      ))}
    </Grid>
  )
}
