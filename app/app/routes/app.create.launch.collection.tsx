import CreateCollectionForm from '~/components/collection-form/Create'

export default function LaunchCollection() {
  return (
    <CreateCollectionForm
      resultLink={(ticker) => `/app/create/launch/${ticker}`}
      resultCTA="Step 2: Set launch options"
      title="Create a collection for the Asteroid launchpad"
      description={
        <p className="mt-2">
          Creating a public launch is a three-step process. First, name,
          describe and upload a main image for your collection using the form on
          this page. In step 2, configure your launch options and whitelist
          settings if applicable. In step 3, upload the artwork for your
          collection.
        </p>
      }
    />
  )
}
