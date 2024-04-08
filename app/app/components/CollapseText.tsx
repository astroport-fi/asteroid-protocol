import { PropsWithChildren } from 'react'
import { Collapse } from 'react-daisyui'

export function CollapseTextTrigger({
  onToggle,
  title,
}: {
  onToggle: () => void
  title: string
}) {
  return (
    <Collapse.Title
      className="p-0 hover:cursor-pointer min-h-[initial]"
      onClick={() => onToggle()}
    >
      <p className="text-ellipsis line-clamp-2">{title}</p>
    </Collapse.Title>
  )
}

export function CollapseTextContent({ children }: PropsWithChildren) {
  return (
    <Collapse.Content className="p-0 whitespace-pre-wrap mt-4">
      {children}
    </Collapse.Content>
  )
}
