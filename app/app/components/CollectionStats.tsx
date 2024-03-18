import { PropsWithChildren } from 'react'
import { CollectionStats } from '~/api/common'
import { getSupplyTitle } from '~/utils/number'
import DecimalText from './DecimalText'
import PercentageText from './PercentageText'

function Stat({ title, children }: PropsWithChildren<{ title: string }>) {
  return (
    <div className="flex flex-col">
      <span className="uppercase text-header-content text-sm">{title}</span>
      <div className="mt-1 font-semibold text-center">{children}</div>
    </div>
  )
}

export default function CollectionStatsComponent({
  stats,
  royaltyPercentage,
}: {
  stats: CollectionStats
  royaltyPercentage?: number
}) {
  const hasRoyalty = !!royaltyPercentage
  return (
    <div className="flex gap-8 w-full justify-center">
      <Stat title="Floor">
        <DecimalText value={stats.floor_price} suffix=" ATOM" />
      </Stat>
      <Stat title="Total Vol">
        <DecimalText value={stats.volume} suffix=" ATOM" />
      </Stat>
      <Stat title="Owners">{getSupplyTitle(stats.owners)}</Stat>
      <Stat title="Listed">{getSupplyTitle(stats.listed)}</Stat>
      <Stat title="Total supply">{getSupplyTitle(stats.supply)}</Stat>
      {hasRoyalty && (
        <Stat title="Royalty">
          <PercentageText value={royaltyPercentage} />
        </Stat>
      )}
    </div>
  )
}
