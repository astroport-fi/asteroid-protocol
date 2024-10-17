import { useFetcher, useNavigation, useSearchParams } from '@remix-run/react'
import { useEffect, useState } from 'react'
import { Loading } from 'react-daisyui'
import InfiniteScroll from 'react-infinite-scroll-component'
import { TrollPost } from '~/api/trollbox'
import { DEFAULT_LIMIT } from '~/utils/pagination'
import PostsList from './Posts'

export default function PostsInfiniteScroll({
  posts,
  count,
  page,
}: {
  posts: TrollPost[]
  count: number
  page: number
}) {
  const [searchParams] = useSearchParams()

  const navigation = useNavigation()
  const fetcher = useFetcher<{ posts: TrollPost[]; page: number }>()
  const [items, setItems] = useState<TrollPost[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!fetcher.data || fetcher.state === 'loading') {
      return
    }

    if (fetcher.data) {
      const newItems = fetcher.data.posts
      setItems((prevItems) => [...prevItems, ...newItems])
    }
  }, [fetcher.data, fetcher.state])

  useEffect(() => {
    setItems(posts)
  }, [posts, setItems])

  useEffect(() => {
    setIsLoading(navigation.state === 'loading')
  }, [navigation.state])

  function getMoreData() {
    const nextPage =
      items.length == DEFAULT_LIMIT ? page + 1 : fetcher.data!.page + 1
    const queryParams = new URLSearchParams(searchParams)
    queryParams.set('page', `${nextPage}`)
    queryParams.set('index', '')
    const query = `?${queryParams.toString()}`
    fetcher.load(query)
  }

  return (
    <InfiniteScroll
      dataLength={items.length}
      next={getMoreData}
      hasMore={count > items.length}
      loader={
        <div className="flex justify-center mb-12">
          {!isLoading && <Loading variant="dots" size="lg" />}
        </div>
      }
      scrollableTarget="scrollableDiv"
    >
      {!isLoading && <PostsList posts={items} />}
    </InfiniteScroll>
  )
}
