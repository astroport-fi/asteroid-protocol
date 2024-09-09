import clsx from 'clsx'
import { FileInput, Input, Textarea } from 'react-daisyui'
import {
  FieldError,
  FieldPath,
  FieldValues,
  Merge,
  UseFormRegister,
} from 'react-hook-form'
import { useRootContext } from '~/context/root'
import InfoTooltip from '../InfoTooltip'
import Label from '../form/Label'

const NAME_MIN_LENGTH = 3
const NAME_MAX_LENGTH = 32

export function Name<TFieldValues extends FieldValues = FieldValues>({
  register,
  name,
  error,
}: {
  register: UseFormRegister<TFieldValues>
  name: string | undefined
  error: FieldError | undefined
}) {
  return (
    <div className="form-control w-full mt-6">
      <Label title="Name" htmlFor="name" />
      <Input
        id="name"
        placeholder="Name your inscription"
        color={error ? 'error' : undefined}
        maxLength={NAME_MAX_LENGTH}
        minLength={NAME_MIN_LENGTH}
        {...register('name' as FieldPath<TFieldValues>, {
          required: true,
          minLength: NAME_MIN_LENGTH,
          maxLength: NAME_MAX_LENGTH,
        })}
      />
      <label className="label" htmlFor="name">
        <span className="label-text-alt text-error">
          {error &&
            (error.message ??
              'Name is required and must be 3-32 characters long.')}
        </span>
        <span className="label-text-alt">{name?.length ?? 0} / 32</span>
      </label>
    </div>
  )
}

export function Description<TFieldValues extends FieldValues = FieldValues>({
  register,
}: {
  register: UseFormRegister<TFieldValues>
}) {
  return (
    <div className="form-control w-full mt-4">
      <Label
        title="Description"
        htmlFor="description"
        tooltip="This content will appear on your inscription’s detail page"
        tooltipClassName="before:ml-10"
      />
      <Textarea
        id="description"
        placeholder="Describe your inscription"
        rows={10}
        {...register('description' as FieldPath<TFieldValues>)}
      />
    </div>
  )
}

export function ContentInput<TFieldValues extends FieldValues = FieldValues>({
  fileName,
  error,
  title = (
    <>
      Inscription Content
      <InfoTooltip
        message="Inscribe any filetype that a browser can display (i.e. JPGs, PDFs, HTML and more!)"
        className="ml-2 before:ml-[-5rem]"
      />
    </>
  ),
  register,
  fileChange,
}: {
  fileName: string | null
  error: Merge<FieldError, (FieldError | undefined)[]> | undefined
  title?: JSX.Element | string
  register: UseFormRegister<TFieldValues>
  fileChange: (file: File | undefined) => void
}) {
  const { maxFileSize } = useRootContext()

  return (
    <div
      className={clsx('flex flex-col', {
        ['bg-base-200 w-full max-w-md border border-neutral border-dashed rounded-3xl p-8']:
          fileName == null,
      })}
    >
      {fileName ? (
        <span className="text-center">{fileName}</span>
      ) : (
        <>
          <span className="flex items-center justify-center text-lg">
            {title}
          </span>
          <span className="mt-4">Max file size</span>
          <span>550kb</span>
        </>
      )}

      <label htmlFor="content" className="btn btn-accent mt-4">
        {fileName ? 'Change file' : 'Select file'}
      </label>
      <FileInput
        key="content"
        id="content"
        className="opacity-0 w-10"
        {...register('content' as FieldPath<TFieldValues>, {
          required: true,
          validate: async (files) => {
            const file = files[0]

            if (file.size > maxFileSize) {
              return `File size exceeds maximum allowed size of ${maxFileSize / 1000} kb`
            }
          },
        })}
        color={error ? 'error' : undefined}
        onChange={(e) => {
          const file = e.target.files?.[0]
          fileChange(file)
        }}
      />
      {error && (
        <span className="text-error">
          {error.message ? error.message : 'Inscription content is required'}
        </span>
      )}
    </div>
  )
}
