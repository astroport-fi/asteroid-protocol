import { Link } from '@remix-run/react'
import { Club } from '~/api/clubs'
import { Collection } from '~/api/collection'
import Grid from './Grid'
import InscriptionImage from './InscriptionImage'

type CollectionBoxType = Pick<
  Collection,
  'symbol' | 'content_path' | 'is_explicit' | 'name'
>

type EditActions = (collection: CollectionBoxType) => JSX.Element

export function CollectionBox({
  collection,
  route = '/app/collection',
  editActions,
}: {
  collection: CollectionBoxType
  route?: string
  editActions?: EditActions
}) {
  return (
    <Link
      className="flex flex-col justify-between bg-base-200 rounded-xl group"
      to={`${route}/${collection.symbol}`}
    >
      <InscriptionImage
        src={collection.content_path!}
        isExplicit={collection.is_explicit}
        className="h-60"
        containerClassName="rounded-t-xl"
      />
      <div className="bg-base-300 rounded-b-xl flex flex-col py-4">
        <div className="flex flex-col px-4">
          <strong className="text-nowrap overflow-hidden text-ellipsis">
            {collection.name}
          </strong>
        </div>
        {typeof editActions === 'function' && (
          <div className="flex justify-end px-4">{editActions(collection)}</div>
        )}
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
        className="h-60"
        containerClassName="rounded-t-xl"
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
  route,
  editActions,
}: {
  collections: CollectionBoxType[]
  className?: string
  route?: string
  editActions?: EditActions
}) {
  return (
    <Grid className={className}>
      {collections.map((collection) => (
        <CollectionBox
          key={collection.symbol}
          collection={collection}
          route={route}
          editActions={editActions}
        />
      ))}
    </Grid>
  )
}
