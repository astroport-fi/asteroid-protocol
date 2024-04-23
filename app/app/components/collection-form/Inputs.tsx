import { GlobeAltIcon } from '@heroicons/react/24/outline'
import { Input, Textarea } from 'react-daisyui'
import {
  Control,
  FieldErrors,
  FieldPath,
  UseFormRegister,
} from 'react-hook-form'
import DiscordIcon from '~/components/icons/discord'
import TelegramIcon from '~/components/icons/telegram'
import TwitterIcon from '~/components/icons/twitter'
import CosmosAddressInput from '../form/CosmosAddressInput'
import Label from '../form/Label'
import NumericInput from '../form/NumericInput'

export type UpdateFormData = {
  description: string
  website: string
  twitter: string
  telegram: string
  discord: string
  royaltyPercentage: number
  paymentAddress: string
}

export type CreateFormData = {
  name: string
  ticker: string
  content: File[]
} & UpdateFormData

// RoyaltyPercentage component
export function RoyaltyPercentage<TFieldValues extends UpdateFormData>({
  control,
  errors,
}: {
  control: Control<TFieldValues>
  errors: FieldErrors<UpdateFormData>
}) {
  return (
    <NumericInput
      control={control}
      error={errors.royaltyPercentage}
      isFloat
      suffix="%"
      decimalScale={2}
      allowNegative={false}
      isAllowed={(values) => {
        const { floatValue } = values
        if (floatValue === undefined) {
          return true
        }
        return floatValue! <= 100
      }}
      name={'royaltyPercentage' as FieldPath<TFieldValues>}
      title="Royalty %"
      tooltip="Can range from 0% to x%. New artists typically choose 5% or less while established artists can command royalties of 5%-15%"
      className="mt-4"
    />
  )
}

export function PaymentAddress<TFieldValues extends UpdateFormData>({
  register,
  errors,
  value,
}: {
  register: UseFormRegister<TFieldValues>
  errors: FieldErrors<UpdateFormData>
  value: string | undefined
}) {
  return (
    <CosmosAddressInput
      register={register}
      required={false}
      name={'paymentAddress' as FieldPath<TFieldValues>}
      error={errors.paymentAddress}
      title="Royalty payment address (optional)"
      tooltip="The address where royalties will be sent. Must be a Cosmos Hub address. If left blank, royalties will be sent to the collection owner's address."
      value={value ?? ''}
    />
  )
}

export function Website<TFieldValues extends UpdateFormData>({
  register,
  errors,
}: {
  register: UseFormRegister<TFieldValues>
  errors: FieldErrors<UpdateFormData>
}) {
  return (
    <div className="form-control w-full mt-4">
      <Label
        title="Website"
        htmlFor="website"
        tooltip="A website or URL dedicated to your collection"
        icon={<GlobeAltIcon className="size-5" />}
      />
      <Input
        id="website"
        color={errors.website ? 'error' : undefined}
        placeholder="Website URL"
        {...register('website' as FieldPath<TFieldValues>, {
          pattern: /^https?:\/\/.+/,
        })}
      />
      {errors.website && (
        <label className="label" htmlFor="website">
          <span className="label-text-alt text-error">
            Website URL is invalid
          </span>
        </label>
      )}
    </div>
  )
}

export function Twitter<TFieldValues extends UpdateFormData>({
  register,
  errors,
}: {
  register: UseFormRegister<TFieldValues>
  errors: FieldErrors<UpdateFormData>
}) {
  return (
    <div className="form-control w-full mt-4">
      <Label
        title="Twitter"
        htmlFor="twitter"
        icon={<TwitterIcon className="size-4" />}
      />
      <Input
        id="twitter"
        color={errors.twitter ? 'error' : undefined}
        placeholder="https://twitter.com/handle"
        {...register('twitter' as FieldPath<TFieldValues>, {
          pattern: /^https:\/\/twitter.com\/.+/,
        })}
      />
      {errors.twitter && (
        <label className="label" htmlFor="twitter">
          <span className="label-text-alt text-error">
            Twitter URL is invalid
          </span>
        </label>
      )}
    </div>
  )
}

export function Telegram<TFieldValues extends UpdateFormData>({
  register,
  errors,
}: {
  register: UseFormRegister<TFieldValues>
  errors: FieldErrors<UpdateFormData>
}) {
  return (
    <div className="form-control w-full mt-4">
      <Label
        title="Telegram"
        htmlFor="telegram"
        icon={<TelegramIcon className="size-4" />}
      />
      <Input
        id="telegram"
        color={errors.telegram ? 'error' : undefined}
        placeholder="https://t.me/channel_name"
        {...register('telegram' as FieldPath<TFieldValues>, {
          pattern: /^https:\/\/t.me\/.+/,
        })}
      />
      {errors.telegram && (
        <label className="label" htmlFor="telegram">
          <span className="label-text-alt text-error">
            Telegram URL is invalid
          </span>
        </label>
      )}
    </div>
  )
}

export function Discord<TFieldValues extends UpdateFormData>({
  register,
  errors,
}: {
  register: UseFormRegister<TFieldValues>
  errors: FieldErrors<UpdateFormData>
}) {
  return (
    <div className="form-control w-full mt-4">
      <Label
        title="Discord"
        htmlFor="discord"
        icon={<DiscordIcon className="size-5" />}
      />
      <Input
        id="discord"
        color={errors.discord ? 'error' : undefined}
        placeholder="https://discord.com/invite/channel_name"
        {...register('discord' as FieldPath<TFieldValues>, {
          pattern: /^https:\/\/discord.com\/.+/,
        })}
      />
      {errors.discord && (
        <label className="label" htmlFor="discord">
          <span className="label-text-alt text-error">
            Discord URL is invalid
          </span>
        </label>
      )}
    </div>
  )
}

export function Description<TFieldValues extends UpdateFormData>({
  register,
}: {
  register: UseFormRegister<TFieldValues>
}) {
  return (
    <div className="form-control w-full mt-4">
      <Label
        title="Description"
        htmlFor="description"
        tooltip="Will appear at the top of your collection's landing page, and can also be used by third-party apps"
      />
      <Textarea
        id="description"
        placeholder="Describe your collection"
        rows={10}
        {...register('description' as FieldPath<TFieldValues>)}
      />
    </div>
  )
}
