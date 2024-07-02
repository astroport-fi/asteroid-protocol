import { ArrowsRightLeftIcon } from '@heroicons/react/24/outline'
import { ChevronDownIcon } from '@heroicons/react/24/solid'
import { LoaderFunctionArgs, json } from '@remix-run/cloudflare'
import { Link, useLoaderData, useSearchParams } from '@remix-run/react'
import clsx from 'clsx'
import { useState } from 'react'
import { Alert, Button, Checkbox, Form, Loading } from 'react-daisyui'
import { useForm } from 'react-hook-form'
import { BridgeHistory } from '~/api/bridge'
import { AsteroidClient } from '~/api/client'
import Address from '~/components/Address'
import DecimalText from '~/components/DecimalText'
import InfoTooltip from '~/components/InfoTooltip'
import FromNeutronBridgeDialog from '~/components/dialogs/FromNeutronBridgeDialog'
import Modal from '~/components/dialogs/Modal'
import SelectBridgeTokenDialog from '~/components/dialogs/SelectBridgeTokenDialog'
import ToNeutronBridgeDialog from '~/components/dialogs/ToNeutronBridgeDialog'
import AddressInput from '~/components/form/AddressInput'
import NumericInput from '~/components/form/NumericInput'
import { useRootContext } from '~/context/root'
import useIsBridgeTransactionProcessed from '~/hooks/bridge/useIsBridgeTransactionProcessed'
import useChain from '~/hooks/useChain'
import useDialog, { useDialogWithValue } from '~/hooks/useDialog'
import {
  useTokenFactoryBalance,
  useTokenFactoryDenom,
  useTokenFactoryMetadata,
} from '~/hooks/useTokenFactory'
import { getAddress } from '~/utils/cookies'
import { getDecimalValue } from '~/utils/number'

const DEFAULT_TICKER = 'ROIDS'

export async function loader({ context, request, params }: LoaderFunctionArgs) {
  const address = await getAddress(request)

  const ticker = params.ticker ?? DEFAULT_TICKER
  const asteroidClient = new AsteroidClient(context.cloudflare.env.ASTEROID_API)
  const token = await asteroidClient.getToken(ticker, true, address)

  if (!token) {
    throw new Response(null, {
      status: 404,
      statusText: 'Not Found',
    })
  }

  const tokens = await asteroidClient.getBridgeTokens()

  // check if tx query param is present
  const txHash = new URL(request.url).searchParams.get('tx')
  let historyItem: BridgeHistory | undefined
  if (txHash) {
    historyItem = await asteroidClient.getBridgeHistoryHash(txHash)
  } else if (address) {
    // check latest send item from bridge history
    historyItem = await asteroidClient.getLatestSendBridgeHistory(address)
  }

  return json({ token, tokens, historyItem })
}

type FormData = {
  amount: number
  destination: string
  agree: boolean
}

function ChainLogo({
  chain,
  className,
}: {
  chain: 'neutron' | 'cosmoshub'
  className: string
}) {
  let token: string = chain
  if (chain === 'cosmoshub') {
    token = 'atom'
  }
  return (
    <img
      alt={`${chain} logo`}
      src={`https://raw.githubusercontent.com/cosmos/chain-registry/master/${chain}/images/${token}.png`}
      className={className}
    />
  )
}

function ChainHeader({
  chain,
  title,
}: {
  chain: 'neutron' | 'cosmoshub'
  title: string
}) {
  return (
    <div className="flex flex-col items-center w-28">
      <ChainLogo className="size-16 rounded-full" chain={chain} />
      <span className="mt-3">{title}</span>
    </div>
  )
}

function WalletRow({
  chain,
  address,
  changeWallet,
  connectWallet,
}: {
  chain: 'neutron' | 'cosmoshub'
  address: string | undefined
  changeWallet: () => void
  connectWallet: () => void
}) {
  return (
    <div className="flex items-center justify-between bg-base-300 w-full rounded-xl p-2 mt-6">
      <div className="flex">
        <ChainLogo chain={chain} className="size-6 rounded-full mr-1" />
        {address ? <Address address={address} start={6} /> : 'Not connected'}
      </div>
      {address ? (
        <Button size="sm" onClick={() => changeWallet()}>
          Change wallet
        </Button>
      ) : (
        <Button size="sm" onClick={() => connectWallet()}>
          Connect wallet
        </Button>
      )}
    </div>
  )
}

function BridgeForm() {
  const { token, tokens } = useLoaderData<typeof loader>()
  const cft20Balance = token.token_holders?.[0]?.amount ?? 0
  const { neutronChainName, chainName: cosmosHubChainName } = useRootContext()
  const {
    connect: connectToNeutron,
    address: neutronAddress,
    openView: openNeutronView,
  } = useChain(neutronChainName)
  const {
    connect: connectToCosmosHub,
    address: cosmosHubAddress,
    openView: openCosmosHubView,
  } = useChain(cosmosHubChainName)
  const tokenMetadata = useTokenFactoryMetadata(token.ticker)
  const tokenFactoryBalance = useTokenFactoryBalance(
    token.ticker,
    neutronAddress,
  )
  const { dialogRef: selectDialogRef, showDialog: showSelectDialog } =
    useDialog()

  const [directionFrom, setDirectionFrom] = useState(true)

  let addressPrefix: string
  let chainName: string
  let address: string | undefined
  let balance: number

  if (directionFrom) {
    addressPrefix = 'neutron'
    chainName = 'Neutron'
    address = neutronAddress
    balance = cft20Balance
  } else {
    addressPrefix = 'cosmos'
    chainName = 'Cosmos Hub'
    address = cosmosHubAddress
    balance = parseInt(tokenFactoryBalance?.amount ?? '0')
  }

  // dialog
  const { dialogRef, value, showDialog } = useDialogWithValue<FormData>()

  // form
  const {
    handleSubmit,
    control,
    register,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      amount: 10,
      destination: '',
      agree: false,
    },
  })
  const destination = watch('destination')

  const onSubmit = handleSubmit(async (formData) => {
    showDialog(formData)
  })

  if (tokenMetadata.isLoading) {
    return <Loading variant="dots" className="items-center" />
  }

  if (!tokenMetadata.metadata) {
    return (
      <Alert className="border border-warning flex justify-between">
        <span>Token {token.ticker} is not enabled for bridging on Neutron</span>
        <Link
          className="btn btn-sm btn-primary ml-2"
          to={`/app/token/${token.ticker}?enableBridging`}
        >
          Enable bridging
        </Link>
      </Alert>
    )
  }

  return (
    <div className="flex flex-col w-full max-w-3xl justify-center items-center bg-base-200 p-10 rounded-xl">
      <div
        className={clsx('flex items-center', {
          'flex-row-reverse': !directionFrom,
        })}
      >
        <ChainHeader chain="cosmoshub" title="Cosmos Hub" />
        <Button
          shape="circle"
          className="mx-6"
          onClick={() => {
            setDirectionFrom(!directionFrom)
            setValue('destination', '')
          }}
        >
          <ArrowsRightLeftIcon className="size-5" />
        </Button>
        <ChainHeader chain="neutron" title="Neutron" />
      </div>

      {directionFrom && (
        <WalletRow
          address={cosmosHubAddress}
          chain="cosmoshub"
          changeWallet={openCosmosHubView}
          connectWallet={connectToCosmosHub}
        />
      )}

      <WalletRow
        address={neutronAddress}
        chain="neutron"
        changeWallet={openNeutronView}
        connectWallet={connectToNeutron}
      />

      <Form
        onSubmit={onSubmit}
        className="flex flex-col items-center w-full mt-6"
      >
        <div className="flex w-full items-center">
          <AddressInput
            register={register}
            name="destination"
            error={errors.destination}
            title="Destination address"
            value={destination}
            addressPrefix={addressPrefix}
            chainName={chainName}
          />
          <Button
            className="ml-2"
            color="neutral"
            type="button"
            size="sm"
            onClick={
              () =>
                address ? setValue('destination', address) : connectToNeutron() // @todo
            }
          >
            Fill in address
          </Button>
        </div>

        <div className="flex flex-row items-start w-full mt-6">
          <button
            type="button"
            onClick={() => showSelectDialog()}
            color="ghost"
            className="flex flex-row justify-between items-center bg-base-300 p-5 w-full rounded-full hover:cursor-pointer"
          >
            <div className="flex">
              <img
                alt={token.name}
                src={token.content_path}
                className="size-6 rounded-full mr-1"
              />
              <span>{token.name}</span>
            </div>
            <ChevronDownIcon className="size-6" />
          </button>
          <div className="flex flex-col w-full ml-4">
            <NumericInput
              control={control}
              name="amount"
              error={errors.amount}
              size="lg"
              isFloat
              required
            />
            <span className="text-sm text-header-content font-light mt-2">
              Your balance:{' '}
              <DecimalText value={balance} suffix={` ${token.ticker}`} />
            </span>
          </div>
        </div>

        <Form.Label className="mt-4">
          <Checkbox
            size="sm"
            color={errors.agree ? 'error' : undefined}
            {...register('agree', {
              required: true,
            })}
          />
          <span
            className={clsx('flex items-center ml-1', {
              'text-error': errors.agree,
            })}
          >
            I agree to the bridging terms and conditions
            <InfoTooltip
              message="All bridging software has been audited, tested and open-sourced. However, it could still be subject to unforeseen smart contract and indexing risks. Any use of the bridge is at the user’s own risk as we explore the outer boundaries of what’s possible with inscriptions!"
              className="ml-1"
            />
          </span>
        </Form.Label>

        <Button color="primary" type="submit" className="mt-8">
          Bridge now
        </Button>
      </Form>
      <Modal ref={dialogRef} backdrop>
        {directionFrom ? (
          <ToNeutronBridgeDialog
            token={token}
            denom={tokenFactoryBalance?.denom ?? ''}
            amount={value?.amount ?? 0}
            destination={value?.destination ?? ''}
          />
        ) : (
          <FromNeutronBridgeDialog
            token={token}
            denom={tokenFactoryBalance?.denom ?? ''}
            amount={value?.amount ?? 0}
            destination={value?.destination ?? ''}
          />
        )}
      </Modal>
      <SelectBridgeTokenDialog tokens={tokens} ref={selectDialogRef} />
    </div>
  )
}

export default function Bridge() {
  const { token, historyItem } = useLoaderData<typeof loader>()
  const denom = useTokenFactoryDenom(token.ticker)
  const [searchParams] = useSearchParams()
  const hasTxParam = searchParams.has('tx')

  const { data: isTransactionProcessed, isLoading } =
    useIsBridgeTransactionProcessed(historyItem)

  const { dialogRef, showDialog } = useDialog()

  let content: JSX.Element
  if (!historyItem) {
    content = <BridgeForm />
  } else if (isLoading || isTransactionProcessed == null) {
    content = <Loading variant="dots" className="items-center" />
  } else if (isTransactionProcessed === false) {
    content = (
      <div>
        <Button color="primary" onClick={showDialog}>
          {hasTxParam
            ? 'Finish bridge transaction'
            : 'Finish your latest bridge transaction'}
        </Button>
        <Modal ref={dialogRef} backdrop>
          <ToNeutronBridgeDialog
            token={token}
            denom={denom}
            amount={getDecimalValue(historyItem.amount, token.decimals)}
            destination={historyItem.receiver}
            bridgeTxHash={historyItem.transaction.hash}
          />
        </Modal>
      </div>
    )
  } else if (!hasTxParam) {
    content = <BridgeForm />
  } else {
    content = (
      <Alert className="border border-primary flex justify-between">
        <span>Bridge transaction has been already processed</span>
        <Link
          to="/app/wallet/bridge"
          className="space-x-1 text-primary link link-hover"
        >
          See bridge history
        </Link>
      </Alert>
    )
  }

  return <div className="flex flex-col items-center">{content}</div>
}
