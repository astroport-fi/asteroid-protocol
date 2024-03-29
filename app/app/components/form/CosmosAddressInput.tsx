import { Form, Input } from 'react-daisyui'
import {
  FieldError,
  FieldPath,
  FieldValues,
  UseFormRegister,
} from 'react-hook-form'
import { twMerge } from 'tailwind-merge'

const ADDRESS_LENGTH = 45

export default function CosmosAddressInput<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  register,
  name,
  title,
  value,
  error,
  className,
}: {
  register: UseFormRegister<TFieldValues>
  name: TName
  title: string
  value: string
  error: FieldError | undefined
  className?: string
}) {
  return (
    <div className={twMerge('form-control w-full', className)}>
      <Form.Label title={title} htmlFor={name} />
      <Input
        id={name}
        placeholder="cosmos1xxxxxx"
        minLength={ADDRESS_LENGTH}
        maxLength={ADDRESS_LENGTH}
        color={error ? 'error' : undefined}
        {...register(name, {
          required: true,
          minLength: ADDRESS_LENGTH,
          maxLength: ADDRESS_LENGTH,
        })}
      />
      <label className="label" htmlFor="name">
        <span className="label-text-alt text-error">
          {error && 'Please enter a Cosmos Hub Address'}
        </span>
        <span className="label-text-alt">{value.length ?? 0} / 45</span>
      </label>
    </div>
  )
}
