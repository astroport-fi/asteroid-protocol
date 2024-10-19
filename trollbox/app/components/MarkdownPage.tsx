import Markdown from 'react-markdown'

export default function MarkdownPage({
  title,
  children,
}: {
  title: string
  children: string
}) {
  return (
    <div className="flex flex-col w-full">
      <h2 className="text-center text-xl mt-4 lg:mt-0">{title}</h2>
      <div className="flex flex-col w-full overflow-y-auto h-[calc(100svh-8rem)] mt-4">
        <Markdown className="prose bg-base-200 p-8 rounded w-full max-w-full">
          {children}
        </Markdown>
      </div>
    </div>
  )
}
