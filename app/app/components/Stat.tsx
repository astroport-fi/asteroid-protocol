import { PropsWithChildren } from 'react'

export default function Stat({
  title,
  children,
}: PropsWithChildren<{ title: string }>) {
  return (
    <div className="flex flex-row justify-center w-full bg-base-200 p-2 rounded-xl">
      <strong>{title}</strong>
      <span className="ml-2">{children}</span>
    </div>
  )
}
