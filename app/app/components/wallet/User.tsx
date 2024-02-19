export type UserProps = {
  name: string
}

export function User({ name }: UserProps) {
  return <div>{name}</div>
}
