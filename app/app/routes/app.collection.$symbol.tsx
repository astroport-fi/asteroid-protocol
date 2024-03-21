import { MetaFunction } from '@remix-run/cloudflare'
import { collectionMeta } from '~/utils/meta'
import InscriptionsPage, { loader } from './app.inscriptions.$clubId'

export { loader }
export default InscriptionsPage

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  if (!data || !data.collection) {
    return []
  }

  return collectionMeta(data.collection)
}
