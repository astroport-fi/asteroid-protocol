import { Form, Input } from 'react-daisyui'
import {
  FieldError,
  FieldPath,
  FieldValues,
  UseFormRegister,
} from 'react-hook-form'
import { twMerge } from 'tailwind-merge'
import InfoTooltip from '../InfoTooltip'

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
  tooltip,
  required = true,
}: {
  register: UseFormRegister<TFieldValues>
  name: TName
  title: string
  value: string
  error: FieldError | undefined
  className?: string
  tooltip?: string
  required?: boolean
}) {
  return (
    <div className={twMerge('form-control w-full', className)}>
      <Form.Label title={title} htmlFor={name} className="justify-start">
        {tooltip && <InfoTooltip message={tooltip} className="ml-2" />}
      </Form.Label>
      <Input
        id={name}
        placeholder="cosmos1xxxxxx"
        minLength={ADDRESS_LENGTH}
        maxLength={ADDRESS_LENGTH}
        color={error ? 'error' : undefined}
        {...register(name, {
          required,
          pattern: /^cosmos1[a-zA-Z0-9]{38}$/,
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
