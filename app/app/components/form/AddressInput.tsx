import { useMemo } from 'react'
import { Form, Input } from 'react-daisyui'
import {
  FieldError,
  FieldPath,
  FieldValues,
  UseFormRegister,
} from 'react-hook-form'
import { twMerge } from 'tailwind-merge'
import InfoTooltip from '../InfoTooltip'

export interface AddressInputProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> {
  register: UseFormRegister<TFieldValues>
  name: TName
  title: string
  value: string
  error: FieldError | undefined
  addressPrefix: string
  chainName: string
  className?: string
  tooltip?: string
  tooltipClassName?: string
  required?: boolean
}

export default function AddressInput<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  register,
  name,
  title,
  value,
  error,
  chainName,
  addressPrefix,
  className,
  tooltip,
  tooltipClassName,
  required = true,
}: AddressInputProps<TFieldValues, TName>) {
  const validationInfo = useMemo(() => {
    return {
      pattern: new RegExp(`^${addressPrefix}1[a-zA-Z0-9]{38}$`, ''),
      length: addressPrefix.length + 39,
    }
  }, [addressPrefix])

  return (
    <div className={twMerge('form-control w-full', className)}>
      <Form.Label title={title} htmlFor={name} className="justify-start">
        {tooltip && (
          <InfoTooltip
            message={tooltip}
            className={twMerge('ml-2', tooltipClassName)}
          />
        )}
      </Form.Label>
      <Input
        id={name}
        placeholder={`${addressPrefix}1xxxxxx`}
        minLength={validationInfo.length}
        maxLength={validationInfo.length}
        color={error ? 'error' : undefined}
        {...register(name, {
          required,
          pattern: validationInfo.pattern,
          minLength: validationInfo.length,
          maxLength: validationInfo.length,
        })}
      />
      <label className="label" htmlFor="name">
        <span className="label-text-alt text-error">
          {error && `Please enter a ${chainName} Address`}
        </span>
        <span className="label-text-alt">
          {value.length ?? 0} / {validationInfo.length}
        </span>
      </label>
    </div>
  )
}
