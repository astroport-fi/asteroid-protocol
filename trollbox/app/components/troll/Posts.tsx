import { twMerge } from 'tailwind-merge'
import { TrollPost } from '~/api/trollbox'
import Post from './Post'

export default function PostsList({
  posts,
  className,
}: {
  posts: TrollPost[]
  className?: string
}) {
  return (
    <div
      className={twMerge(
        'flex flex-col w-full items-center overflow-y-auto',
        className,
      )}
    >
      {posts.map((post) => (
        <Post key={post.id} post={post} />
      ))}
    </div>
  )
}
