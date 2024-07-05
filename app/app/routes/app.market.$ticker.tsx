import type { TxInscription } from '@asteroid-protocol/sdk'
import { ValueTypes, order_by } from '@asteroid-protocol/sdk/client'
import { LoaderFunctionArgs, json } from '@remix-run/cloudflare'
import { Link, useLoaderData } from '@remix-run/react'
import { useMemo, useState } from 'react'
import { Button, Link as DaisyLink } from 'react-daisyui'
import { AsteroidClient } from '~/api/client'
import { ListingState, getListingState } from '~/api/marketplace'
import { MarketplaceTokenListing } from '~/api/token'
import { BackHeader } from '~/components/Back'
import GhostEmptyState from '~/components/GhostEmptyState'
import InscriptionImage from '~/components/InscriptionImage'
import BuyDialog from '~/components/dialogs/BuyDialog'
import SellTokenDialog from '~/components/dialogs/SellTokenDialog'
import TxDialog from '~/components/dialogs/TxDialog'
import BuyListingsTable from '~/components/market/BuyListingsTable'
import BuySettings from '~/components/market/BuySettings'
import LatestTransactions from '~/components/market/LatestTransactions'
import ReservedListingsTable from '~/components/market/ReservedListingsTable'
import Stats from '~/components/market/Stats'
import { ASTROPORT_ATOM_DENOM } from '~/constants'
import { useRootContext } from '~/context/root'
import { useSwapAstroportUrl } from '~/hooks/astroport/useAstroportUrl'
import useDialog, { useDialogWithValue } from '~/hooks/useDialog'
import { useMarketplaceOperations } from '~/hooks/useOperations'
import {
  useTokenFactoryDenom,
  useTokenFactoryMetadata,
} from '~/hooks/useTokenFactory'
import useAddress from '~/hooks/wallet/useAddress'
import { getAddress } from '~/utils/cookies'
import { getDecimalValue } from '~/utils/number'
import { parsePagination, parseSorting } from '~/utils/pagination'

export function getTokenMarketplaceListingSort(
  sort: string,
  direction: order_by,
): ValueTypes['marketplace_cft20_detail_order_by'] {
  if (sort === 'marketplace_listing_total') {
    return {
      marketplace_listing: {
        total: direction,
      },
    }
  } else if (sort === 'marketplace_listing_deposit_total') {
    return {
      marketplace_listing: {
        deposit_total: direction,
      },
    }
  } else {
    return {
      [sort]: direction,
    }
  }
}

export async function loader({ context, request, params }: LoaderFunctionArgs) {
  if (!params.ticker) {
    throw new Response(null, {
      status: 404,
      statusText: 'Not Found',
    })
  }

  const url = new URL(request.url)
  const { offset, limit } = parsePagination(url.searchParams, 50)
  const { sort, direction } = parseSorting(
    url.searchParams,
    'ppt',
    order_by.asc,
  )
  const txsType = url.searchParams.get('txs')

  const address = await getAddress(request)
  const asteroidClient = new AsteroidClient(context.cloudflare.env.ASTEROID_API)
  const token = await asteroidClient.getToken(params.ticker, false, address)

  if (!token) {
    throw new Response(null, {
      status: 404,
      statusText: 'Not Found',
    })
  }

  const orderBy = getTokenMarketplaceListingSort(sort, direction)

  const res = await asteroidClient.getTokenListings(
    token.id,
    offset,
    limit,
    orderBy,
    true,
  )

  const transactions = await asteroidClient.getTokenTradeHistory(
    txsType === 'token' ? token.id : undefined,
    0,
    50,
  )

  if (address) {
    const status = await asteroidClient.getStatus(
      context.cloudflare.env.CHAIN_ID,
    )
    if (status) {
      const reservedListings = await asteroidClient.getTokenListings(
        token.id,
        0,
        100,
        orderBy,
        false,
        { currentBlock: status.last_processed_height, depositor: address },
      )
      return json({
        token,
        transactions,
        listings: res.listings,
        reservedListings: reservedListings.listings,
        pages: Math.ceil(res.count! / limit),
        total: res.count!,
        limit,
      })
    }
  }

  return json({
    token,
    transactions,
    listings: res.listings,
    reservedListings: [],
    pages: Math.ceil(res.count! / limit),
    total: res.count!,
    limit,
  })
}

interface Operation {
  inscription: TxInscription
  feeTitle?: string
}

function useListingActions() {
  const {
    dialogRef: txDialogRef,
    value: operation,
    showDialog: showTxDialog,
  } = useDialogWithValue<Operation>()
  const {
    dialogRef: buyDialogRef,
    value: listingHash,
    showDialog: showBuyDialog,
  } = useDialogWithValue<string | string[]>()
  const operations = useMarketplaceOperations()

  function cancelListing(listingHash: string) {
    if (!operations) {
      console.warn('No address')
      return
    }

    const txInscription = operations.delist(listingHash)

    showTxDialog({ inscription: txInscription })
  }

  function buyListing(listingHash: string | string[]) {
    if (!operations) {
      console.warn('No address')
      return
    }

    operations.buy(listingHash, 'cft20').then((txInscription) => {
      showTxDialog({
        inscription: txInscription,
        feeTitle: 'Token listing price',
      })
    })
  }

  function reserveListing(listingHash: string | string[]) {
    showBuyDialog(listingHash)
  }

  return {
    actions: {
      cancelListing,
      buyListing,
      reserveListing,
    },
    operation,
    listingHash,
    txDialogRef,
    buyDialogRef,
  }
}

export default function MarketPage() {
  const data = useLoaderData<typeof loader>()
  const { dialogRef: sellDialogRef, showDialog: showSellDialog } = useDialog()
  const amount = data.token.token_holders?.[0]?.amount
  const { token } = data
  const minted = token.circulating_supply / token.max_supply
  const [selectedListings, setSelectedListings] = useState<
    MarketplaceTokenListing[]
  >([])
  const address = useAddress()
  const {
    status: { lastKnownHeight },
  } = useRootContext()
  const { actions, operation, listingHash, txDialogRef, buyDialogRef } =
    useListingActions()
  const availableListings = useMemo(() => {
    return data.listings.filter((listing) => {
      const listingState = getListingState(
        listing.marketplace_listing,
        address,
        lastKnownHeight,
      )
      return listingState === ListingState.Reserve
    })
  }, [data.listings, address, lastKnownHeight])
  const hasListings = data.listings.length > 0

  const denom = useTokenFactoryDenom(token.ticker)
  const { isLoading: isLoadingMetadata, metadata } = useTokenFactoryMetadata(
    token.ticker,
  )
  const swapUrl = useSwapAstroportUrl(denom, ASTROPORT_ATOM_DENOM)

  return (
    <div className="flex flex-col md:flex-row h-full">
      {hasListings && (
        <BuySettings
          token={token}
          onChange={(listings) => {
            setSelectedListings(availableListings.slice(0, listings))
          }}
          selectedListings={selectedListings}
          max={Math.min(data.limit, availableListings.length)}
        />
      )}
      <div className="flex flex-col w-full md:h-full h-[calc(100%-13rem)]">
        <div className="flex flex-col mb-2 mt-4 lg:mt-8 pl-0 pr-4 lg:px-8">
          <div className="flex flex-row justify-between items-center">
            <BackHeader to="/app/tokens">
              <InscriptionImage
                mime="image/png"
                src={token.content_path!}
                // isExplicit={token.is_explicit} @todo
                className="size-6"
                imageClassName="rounded-xl"
              />
              <span className="ml-2 text-lg flex items-baseline">
                Trade {token.name}
                <span className="text-sm font-light text-header-content ml-1 hidden lg:inline">
                  {token.ticker}
                </span>
              </span>
            </BackHeader>
            <div className="flex flex-row items-center">
              {minted < 1 && (
                <Link
                  className="btn btn-primary btn-sm mr-2 hidden md:inline-flex"
                  to={`/app/token/${token.ticker}`}
                >
                  Mint now
                </Link>
              )}
              <Button
                color="primary"
                size="sm"
                onClick={() => showSellDialog()}
              >
                Sell
                <span className="hidden lg:inline">{token.ticker} tokens</span>
              </Button>
              {metadata ? (
                <DaisyLink
                  className="btn btn-sm btn-primary ml-2"
                  target="_blank"
                  href={swapUrl}
                >
                  Swap on Astroport
                </DaisyLink>
              ) : isLoadingMetadata ? (
                <Button
                  color="primary"
                  size="sm"
                  loading
                  className="ml-2"
                ></Button>
              ) : (
                <Link
                  className="btn btn-sm btn-primary ml-2"
                  to={`/app/token/${token.ticker}?enableBridging`}
                >
                  Enable bridging
                </Link>
              )}
            </div>
          </div>
          {hasListings && <Stats token={token} />}
        </div>
        {data.reservedListings?.length > 0 && (
          <div className="ml-8">
            <h3 className="mt-10 text-lg">Your reserved listing</h3>
            <ReservedListingsTable
              className="mt-2"
              listings={data.reservedListings}
              token={token}
              actions={actions}
            />
            <h3 className="mt-16 text-lg">All listings</h3>
          </div>
        )}

        {hasListings ? (
          <BuyListingsTable
            className="mt-2 mb-4 lg:mb-6 no-scrollbar"
            listings={data.listings}
            selectedListings={selectedListings}
            onSelectedChange={(listings) => setSelectedListings(listings)}
            pages={data.pages}
            total={data.total}
            token={token}
            actions={actions}
          />
        ) : (
          <GhostEmptyState text="Be the first to create a listing for this token.">
            <Button
              color="primary"
              className="mt-6"
              onClick={() => showSellDialog()}
            >
              Sell {token.ticker} tokens
            </Button>
          </GhostEmptyState>
        )}
        <SellTokenDialog
          ref={sellDialogRef}
          ticker={token.ticker}
          tokenAmount={amount ?? 0}
          lastPrice={getDecimalValue(token.last_price_base, token.decimals)}
        />
        <TxDialog
          ref={txDialogRef}
          txInscription={operation?.inscription ?? null}
          feeOperationTitle={operation?.feeTitle}
          resultCTA="Back to market"
          resultLink={`/app/market/${token.ticker}`}
        />
        <BuyDialog
          buyType="cft20"
          listingHash={listingHash}
          ref={buyDialogRef}
          resultLink={`/app/market/${token.ticker}`}
        />
      </div>
      <LatestTransactions token={token} transactions={data.transactions} />
    </div>
  )
}
