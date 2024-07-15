import { FieldError } from 'react-hook-form'

export default function ErrorLabel({
  error,
}: {
  error: FieldError | undefined
}) {
  if (!error) return
  return (
    <label className="label">
      <span className="label-text-alt text-error">{error.message}</span>
    </label>
  )
}
