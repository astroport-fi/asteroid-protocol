import { PlusIcon } from '@heroicons/react/20/solid'
import { Link } from '@remix-run/react'
import { Select } from 'react-daisyui'
import {
  FieldError,
  FieldPath,
  FieldValues,
  UseFormRegister,
} from 'react-hook-form'
import type { To } from 'react-router'
import { TransactionHash } from '~/api/transaction'
import Label from './Label'

export function CollectionSelect<
  TFieldValues extends FieldValues = { collection: string },
>({
  collections,
  error,
  register,
  link = '/app/create/collection',
  linkInNewTab = true,
  title = 'Collection',
  tooltip,
  required = false,
}: {
  collections: { transaction: TransactionHash; name: string }[]
  error: FieldError | undefined
  register: UseFormRegister<TFieldValues>
  link?: To
  linkInNewTab?: boolean
  title?: string
  tooltip?: string
  required?: boolean
}) {
  return (
    <div className="form-control w-full mt-6">
      <Label title={title} htmlFor="collection" tooltip={tooltip} />
      <div className="flex w-full gap-4 items-center">
        <Select
          id="collection"
          className="w-full"
          color={error ? 'error' : undefined}
          {...register(
            'collection' as FieldPath<TFieldValues>,
            required
              ? {
                  required: true,
                  minLength: 64,
                }
              : undefined,
          )}
        >
          <Select.Option value={0}>Select collection</Select.Option>
          {collections.map((collection) => (
            <Select.Option
              key={collection.transaction.hash}
              value={collection.transaction.hash}
            >
              {collection.name}
            </Select.Option>
          ))}
        </Select>
        <Link
          className="btn btn-accent btn-sm btn-circle mr-1"
          to={link}
          rel="noopener noreferrer"
          target={linkInNewTab ? '_blank' : undefined}
        >
          <PlusIcon className="size-5" />
        </Link>
      </div>
    </div>
  )
}
