import clsx from 'clsx'
import { Form, Input, InputProps } from 'react-daisyui'
import {
  Control,
  Controller,
  FieldError,
  FieldPath,
  FieldValues,
} from 'react-hook-form'
import { NumericFormat, NumericFormatProps } from 'react-number-format'
import { twMerge } from 'tailwind-merge'

export default function NumericInput<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  control,
  name,
  title,
  error,
  isFloat,
  className,
  ...props
}: {
  control: Control<TFieldValues>
  name: TName
  title: string
  error: FieldError | undefined
  isFloat?: boolean
  className?: string
} & NumericFormatProps<InputProps>) {
  return (
    <div className={twMerge('form-control w-full', className)}>
      <Form.Label title={title} htmlFor={name} />
      <Controller
        rules={{ required: true, pattern: /^[0-9]+$/ }}
        control={control}
        name={name}
        render={({
          field: { name, onChange, value, ref, onBlur, disabled },
        }) => (
          <NumericFormat
            {...props}
            className="w-full"
            getInputRef={ref}
            value={value}
            onBlur={onBlur}
            disabled={disabled}
            id={name}
            name={name}
            onValueChange={(v) => {
              let value
              if (v.value) {
                if (isFloat) {
                  value = parseFloat(v.value)
                } else {
                  value = parseInt(v.value)
                }
              } else {
                value = ''
              }

              onChange(value)
            }}
            thousandSeparator=" "
            customInput={Input}
            placeholder={title}
            color={error ? 'error' : undefined}
          />
        )}
      />

      <label className="label" htmlFor={name}>
        <span
          className={clsx('label-text-alt', {
            ['text-error']: error != null,
          })}
        >
          {error && 'Required'}
        </span>
      </label>
    </div>
  )
}
