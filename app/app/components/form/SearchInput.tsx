import { MagnifyingGlassIcon } from '@heroicons/react/20/solid'
import { useSearchParams } from '@remix-run/react'
import { Form as DaisyForm, Form } from 'react-daisyui'
import { ExistingSearchParams } from 'remix-utils/existing-search-params'
import { useDebounceSubmit } from 'remix-utils/use-debounce-submit'
import { twMerge } from 'tailwind-merge'

export default function SearchInput({
  placeholder,
  className,
}: {
  placeholder: string
  className?: string
}) {
  const [searchParams] = useSearchParams()
  const defaultSearch = searchParams.get('search') ?? ''
  const submit = useDebounceSubmit()

  return (
    <Form method="get">
      <ExistingSearchParams exclude={['search']} />
      <DaisyForm.Label
        className={twMerge(
          'input input-bordered flex items-center gap-2',
          className,
        )}
        htmlFor="search"
      >
        <input
          type="text"
          id="search"
          name="search"
          className="grow w-full"
          placeholder={placeholder}
          defaultValue={defaultSearch}
          onChange={(event) => {
            submit(event.target.form, {
              debounceTimeout: 500,
            })
          }}
          onBlur={(event) => {
            submit(event.target.form, {
              debounceTimeout: 0,
            })
          }}
        />
        <MagnifyingGlassIcon className="size-5" />
      </DaisyForm.Label>
    </Form>
  )
}
