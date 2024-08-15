import { Link } from '@remix-run/react'
import { Link as DaisyLink } from 'react-daisyui'
import CreateCollectionForm from '~/components/collection-form/Create'

export default function CreateCollectionMint() {
  return (
    <CreateCollectionForm
      resultLink={(ticker) =>
        `/app/create/collection/${ticker}/mint/inscriptions`
      }
      resultCTA="Mint inscriptions"
      description={
        <p className="mt-2">
          Creating a collection is a two-step process. First, create a
          collection inscription using the form below. Then, you can add
          inscriptions to your collection on the{' '}
          <Link
            className="link link-hover"
            to="/app/create/collection/mint/inscriptions"
            target="_blank"
          >
            Create Inscription
          </Link>{' '}
          page. All information below will appear on your collection&apos;s
          landing page on{` `}
          <DaisyLink href="https://asteroidprotocol.io">
            asteroidprotocol.io
          </DaisyLink>
          . Note that collection inscriptions are non-transferrable.
        </p>
      }
    />
  )
}
