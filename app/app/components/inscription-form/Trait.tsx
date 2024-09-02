import { XMarkIcon } from '@heroicons/react/24/outline'
import { Button, Input } from 'react-daisyui'
import {
  FieldError,
  FieldPath,
  FieldValues,
  UseFormRegister,
} from 'react-hook-form'
import Label from '../form/Label'

export default function Trait<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  register,
  remove,
  traitType,
  traitTypeError,
  traitValue,
  traitValueError,
}: {
  register: UseFormRegister<TFieldValues>
  remove: () => void
  traitType: TName
  traitTypeError: FieldError | undefined
  traitValue: TName
  traitValueError: FieldError | undefined
}) {
  return (
    <div className="flex  w-full justify-between gap-4 mb-2">
      <div className="form-control w-full">
        <Label
          title="Name"
          htmlFor={traitType}
          tooltip="A category for your trait (i.e. hair color)"
        />
        <Input
          className="w-full"
          color={traitTypeError ? 'error' : undefined}
          id={traitType}
          {...register(traitType, {
            pattern: /^[a-zA-Z0-9- ]+$/,
          })}
        />
      </div>
      <div className="form-control w-full">
        <Label
          title="Value"
          htmlFor={traitValue}
          tooltip={`The trait's data (i.e. the "hair color" trait could have a value of "red" or "black")`}
        />
        <Input
          className="w-full"
          color={traitValueError ? 'error' : undefined}
          id={traitValue}
          {...register(traitValue, {
            pattern: /^[a-zA-Z0-9-. ]+$/,
          })}
        />
      </div>
      <Button
        type="button"
        shape="circle"
        className="mt-12"
        color="error"
        size="xs"
        onClick={() => remove()}
      >
        <XMarkIcon className="size-5" />
      </Button>
    </div>
  )
}
