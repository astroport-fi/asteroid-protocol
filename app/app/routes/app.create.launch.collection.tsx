import { Link as DaisyLink } from 'react-daisyui'
import CreateCollectionForm from '~/components/collection-form/Create'

export default function LaunchCollection() {
  return (
    <CreateCollectionForm
      resultLink={(ticker) => `/app/create/launch/${ticker}`}
      resultCTA="Set launch options"
      description={
        <p className="mt-2">
          Launching a collection is a three-step process. First, create a
          collection inscription using the form below. Then you set launch
          options and finally, you can upload inscriptions to your collection.
          All information below will appear on your collection&apos;s landing
          page on{` `}
          <DaisyLink href="https://asteroidprotocol.io">
            asteroidprotocol.io
          </DaisyLink>
          . Note that collection inscriptions are non-transferrable.
        </p>
      }
    />
  )
}
