import { useState } from 'react'
import { Button, Input, Range } from 'react-daisyui'
import { MarketplaceTokenListing, Token } from '~/api/token'
import DecimalText from '~/components/DecimalText'
import { useDialogWithValue } from '~/hooks/useDialog'
import AtomValue from '../AtomValue'
import BuyDialog from '../dialogs/BuyDialog'

export default function BuySettings({
  token,
  selectedListings,
  max,
  onChange,
}: {
  token: Token
  selectedListings: MarketplaceTokenListing[]
  max: number
  onChange: (listings: number) => void
}) {
  const [value, setValue] = useState(0)
  const {
    dialogRef,
    value: listingHashes,
    showDialog,
  } = useDialogWithValue<string | string[]>()

  function changeValue(v: number) {
    setValue(v)
    onChange(v)
  }

  const totalTokens = selectedListings.reduce(
    (acc, listing) => acc + listing.amount,
    0,
  )
  const totalAtom = selectedListings.reduce(
    (acc, listing) => acc + listing.marketplace_listing.total,
    0,
  )

  return (
    <div className="flex flex-col px-4 pt-8 shrink-0 border-r border-r-neutral">
      <strong>Listings to buy</strong>
      <div className="flex flex-row items-center mt-4">
        <Range
          type="range"
          min={0}
          max={max}
          value={value}
          size="sm"
          onChange={(e) => changeValue(parseInt(e.target.value))}
        />
        <Input
          type="number"
          className="ml-2 w-16 pr-0"
          size="sm"
          min={0}
          max={max}
          step={1}
          value={value}
          onChange={(e) => changeValue(parseInt(e.target.value))}
        />
      </div>
      <div className="flex flex-col mt-4 items-center">
        <span>
          <DecimalText value={totalTokens} /> {token.ticker}
        </span>
        <span className="my-2">for</span>
        <AtomValue value={totalAtom} horizontal />
      </div>
      <Button
        className="mt-4"
        color="accent"
        size="sm"
        onClick={() => {
          showDialog(
            selectedListings.map((l) => l.marketplace_listing.transaction.hash),
          )
        }}
      >
        Buy {selectedListings.length} listings
      </Button>
      <BuyDialog
        buyType="cft20"
        listingHash={listingHashes}
        ref={dialogRef}
        resultLink={`/app/market/${token.ticker}`}
      />
    </div>
  )
}
