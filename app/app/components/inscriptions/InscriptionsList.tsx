import { useFetcher, useNavigation, useSearchParams } from '@remix-run/react'
import { useEffect, useRef, useState } from 'react'
import { Loading } from 'react-daisyui'
import InfiniteScroll from 'react-infinite-scroll-component'
import { InscriptionsResult } from '~/api/client'
import { InscriptionWithMarket } from '~/api/inscription'
import { LIMIT } from '.'
import { Inscriptions } from '../Inscriptions'

export default function InscriptionsList({
  inscriptions,
  count,
  page,
  onClick,
}: {
  inscriptions: InscriptionWithMarket[]
  count: number
  page: number
  onClick: (inscription: InscriptionWithMarket) => void
}) {
  const [searchParams] = useSearchParams()

  const ref = useRef<HTMLDivElement>(null)
  const navigation = useNavigation()
  const isLoading = navigation.state === 'loading'
  const fetcher = useFetcher<{ data: InscriptionsResult; page: number }>()
  const [items, setItems] = useState<InscriptionWithMarket[]>([])

  useEffect(() => {
    if (!fetcher.data || fetcher.state === 'loading') {
      return
    }

    if (fetcher.data) {
      const newItems = (fetcher.data.data as InscriptionsResult).inscriptions
      setItems((prevItems) => [...prevItems, ...newItems])
    }
  }, [fetcher.data, fetcher.state])

  useEffect(() => {
    if (ref.current) {
      ref.current.scrollTop = 0
    }
    setItems(inscriptions)
  }, [inscriptions, setItems])

  function getMoreData() {
    const nextPage = items.length == LIMIT ? page + 1 : fetcher.data!.page + 1
    const queryParams = new URLSearchParams(searchParams)
    queryParams.set('page', `${nextPage}`)
    const query = `?${queryParams.toString()}`
    fetcher.load(query)
  }

  if (inscriptions.length < 1) {
    return (
      <div className="flex flex-col w-full">
        <span className="mt-8 ml-8">No inscriptions for selected filters</span>
      </div>
    )
  }

  return (
    <div id="scrollableDiv" ref={ref} className="overflow-y-scroll h-full">
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
        {!isLoading && (
          <Inscriptions
            className="p-8"
            inscriptions={items}
            onClick={onClick}
          />
        )}
      </InfiniteScroll>
    </div>
  )
}
