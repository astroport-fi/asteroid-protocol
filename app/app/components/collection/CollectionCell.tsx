import { TopCollection } from '~/api/collection'
import InscriptionImage from '../InscriptionImage'

export function CollectionCell({
  collection,
}: {
  collection: Pick<TopCollection, 'content_path' | 'name' | 'symbol'>
}) {
  return (
    <span className="flex items-center">
      <InscriptionImage
        mime="image/png"
        src={collection.content_path!}
        className="size-12 shrink-0"
        imageClassName="rounded-full"
      />
      <span className="text-base ml-3">{collection.name}</span>
    </span>
  )
}
