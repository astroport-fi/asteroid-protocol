import { useSearchParams } from '@remix-run/react'
import { Form as DaisyForm, Form } from 'react-daisyui'
import { ExistingSearchParams } from 'remix-utils/existing-search-params'
import { useDebounceSubmit } from 'remix-utils/use-debounce-submit'
import { twMerge } from 'tailwind-merge'
import SearchIcon from '../icons/Search'

interface SearchInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

export function SearchInput(props: SearchInputProps) {
  return (
    <DaisyForm.Label
      className={twMerge(
        'input input-bordered flex items-center gap-2',
        props.className,
      )}
      htmlFor="search"
    >
      <input
        {...props}
        autoComplete="off"
        type="text"
        id="search"
        name="search"
        className="grow w-full"
      />
      <SearchIcon className="size-6" />
    </DaisyForm.Label>
  )
}

export default function SearchInputForm({
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
    <Form
      method="get"
      onSubmit={(e) => {
        e.preventDefault()
        e.stopPropagation()
      }}
    >
      <ExistingSearchParams exclude={['search']} />

      <SearchInput
        className={className}
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
    </Form>
  )
}
