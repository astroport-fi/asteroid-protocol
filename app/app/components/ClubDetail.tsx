import clsx from 'clsx'
import { Club, ClubStats } from '~/api/clubs'
import CollectionStatsComponent from './CollectionStats'

export default function ClubDetail({
  club,
  stats,
}: {
  club: Club
  stats: ClubStats | undefined
}) {
  return (
    <div className="flex p-5 pb-6  border-b border-b-neutral items-center">
      <span className="flex flex-shrink-0 items-center justify-center p-2 size-20 bg-no-repeat bg-cover bg-center rounded-full bg-[url('/app/images/clubs/clouds.png')]">
        <span className="bg-black bg-opacity-60 w-full text-center text-xl font-medium">
          {club.range ? '< ' : ''}
          {club.id}
        </span>
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
