import { FieldPath, FieldValues } from 'react-hook-form'
import AddressInput, { AddressInputProps } from './AddressInput'

export default function CosmosAddressInput<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>(
  props: Omit<
    AddressInputProps<TFieldValues, TName>,
    'addressPrefix' | 'chainName'
  >,
) {
  return (
    <AddressInput {...props} addressPrefix="cosmos" chainName="Cosmos Hub" />
  )
}
