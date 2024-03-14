import clsx from 'clsx'
import { Club } from '~/api/clubs'
import { CollectionStats } from '~/api/common'
import CollectionStatsComponent from './CollectionStats'

export default function ClubDetail({
  club,
  stats,
}: {
  club: Club
  stats: CollectionStats | undefined
}) {
  return (
    <div className="flex p-5 pb-6  border-b border-b-neutral items-center">
      <span className="flex flex-shrink-0 items-center justify-center bg-base-200 size-20 rounded-full text-xl font-bold">
        &lt; {club.id}
      </span>
      <div
        className={clsx(
          'flex flex-col ml-4 mt-1 h-full flex-shrink-0 justify-center',
        )}
      >
        <h2 className="text-xl">{club.title}</h2>
      </div>
      {stats && <CollectionStatsComponent stats={stats} />}
    </div>
  )
}
