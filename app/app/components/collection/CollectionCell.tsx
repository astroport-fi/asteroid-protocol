import { TopCollection } from '~/api/collection'
import InscriptionImage from '../InscriptionImage'

export function CollectionCell({
  collection,
}: {
  collection: Pick<TopCollection, 'content_path' | 'name' | 'symbol'>
}) {
  const isTrollbox = collection.symbol.startsWith('TROLL:')
  return (
    <span className="flex items-center">
      {isTrollbox ? (
        <span className="flex size-12 rounded-full bg-base-300 items-center justify-center">
          TROLL
        </span>
      ) : (
        <InscriptionImage
          mime="image/png"
          src={collection.content_path!}
          className="size-12 shrink-0"
          imageClassName="rounded-full"
        />
      )}
      <span className="text-base ml-3">{collection.name}</span>
    </span>
  )
}
