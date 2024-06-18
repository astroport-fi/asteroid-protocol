import { order_by } from '@asteroid-protocol/sdk/client'
import { ArrowTopRightOnSquareIcon } from '@heroicons/react/20/solid'
import { LoaderFunctionArgs, MetaFunction, json } from '@remix-run/cloudflare'
import { Link, useLoaderData } from '@remix-run/react'
import {
  createColumnHelper,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { format } from 'date-fns'
import { useMemo } from 'react'
import { Badge, Button, Divider } from 'react-daisyui'
import { AsteroidClient, TraitItem } from '~/api/client'
import {
  InscriptionDetail,
  InscriptionHistory,
  InscriptionWithMarket,
} from '~/api/inscription'
import Address from '~/components/Address'
import AddressChip from '~/components/AddressChip'
import { BackHeader } from '~/components/Back'
import { InscriptionActions } from '~/components/InscriptionActions'
import InscriptionImage from '~/components/InscriptionImage'
import TxLink from '~/components/TxLink'
import { NotAffiliatedWarning } from '~/components/alerts/NotAffiliatedAlert'
import GrantMigrationPermissionDialog from '~/components/dialogs/GrantMigrationPermissionDialog'
import Table from '~/components/table'
import useAddress from '~/hooks/useAddress'
import useDialog from '~/hooks/useDialog'
import useSorting from '~/hooks/useSorting'
import { usesAsteroidSocialLinks } from '~/utils/collection'
import { DATETIME_FORMAT } from '~/utils/date'
import { inscriptionMeta } from '~/utils/meta'
import { parseSorting } from '~/utils/pagination'

export async function loader({ context, params, request }: LoaderFunctionArgs) {
  const asteroidClient = new AsteroidClient(context.cloudflare.env.ASTEROID_API)

  if (!params.hash) {
    throw new Response(null, {
      status: 404,
      statusText: 'Not Found',
    })
  }

  const inscription = await asteroidClient.getInscriptionWithMarket(params.hash)

  if (!inscription) {
    throw new Response(null, {
      status: 404,
      statusText: 'Not Found',
    })
  }

  const { sort, direction } = parseSorting(
    new URL(request.url).searchParams,
    'height',
    order_by.desc,
  )

  const history = await asteroidClient.getInscriptionHistory(
    inscription.id,
    0,
    50,
    {
      [sort]: direction,
    },
  )

  return json({ inscription, history })
}

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  if (!data) {
    return []
  }

  return inscriptionMeta(data.inscription)
}

function AddToCollection({
  inscription,
}: {
  inscription: InscriptionWithMarket<InscriptionDetail>
}) {
  const address = useAddress()

  if (
    inscription.version == 'v1' ||
    inscription.collection != null ||
    address != inscription.creator
  ) {
    return
  }

  return (
    <div className="flex flex-col mt-6">
      <strong>Collection</strong>
      <div className="mt-2">
        <Link
          className="btn btn-primary btn-sm"
          to={`/app/migrate/inscription/${inscription.transaction.hash}`}
        >
          Add to collection
        </Link>
      </div>
    </div>
  )
}

function Migration({
  inscription,
}: {
  inscription: InscriptionWithMarket<InscriptionDetail>
}) {
  const address = useAddress()
  const { dialogRef, showDialog } = useDialog()
  const grantee = inscription.migration_permission_grants?.[0]?.grantee

  if (inscription.version != 'v1') {
    return
  }

  if (grantee && address == grantee) {
    return (
      <div className="flex flex-col mt-6">
        <strong>Migration</strong>
        <p>You have permission to migrate this inscription</p>
        <div className="mt-2">
          <Link
            className="btn btn-primary btn-sm"
            to={`/app/migrate/inscription/${inscription.transaction.hash}`}
          >
            Migrate Inscription
          </Link>
        </div>
      </div>
    )
  }

  if (address != inscription.creator) {
    return
  }

  return (
    <div className="flex flex-col mt-6">
      <strong>Migration</strong>
      <div className="mt-2">
        <Link
          className="btn btn-primary btn-sm"
          to={`/app/migrate/inscription/${inscription.transaction.hash}`}
        >
          Migrate Inscription
        </Link>

        {grantee ? (
          <div className="flex mt-2 items-center">
            <span className="mr-2">Migration permission granted to:</span>
            <AddressChip address={grantee} />
          </div>
        ) : (
          <>
            <span className="mx-2">or</span>
            <Button color="primary" size="sm" onClick={() => showDialog()}>
              Grant Migration Permission
            </Button>
            <GrantMigrationPermissionDialog
              inscription={inscription}
              ref={dialogRef}
            />
          </>
        )}
      </div>
    </div>
  )
}

function InscriptionDetailComponent({
  inscription,
}: {
  inscription: InscriptionWithMarket<InscriptionDetail>
}) {
  const hasAttributes =
    inscription.attributes != null && inscription.attributes.length > 0
  const notAffiliatedWarning = useMemo(() => {
    if (!inscription.collection) {
      return false
    }
    return usesAsteroidSocialLinks(inscription.collection.metadata)
  }, [inscription.collection])

  return (
    <div className="flex flex-col xl:grid grid-cols-2 gap-4 w-full mt-4">
      <div className="flex flex-1 flex-col px-4 lg:px-8 items-center">
        <InscriptionImage
          mime={inscription.mime}
          src={inscription.content_path}
          isExplicit={inscription.is_explicit}
          imageClassName="rounded-xl object-contain"
          className="max-w-3xl w-full"
        />
        <Link
          to={`/inscription/${inscription.transaction.hash}`}
          className="inline-flex items-center mt-4 link link-primary link-hover"
        >
          Open in viewer <ArrowTopRightOnSquareIcon className="size-5 ml-1" />
        </Link>
      </div>
      <div className="flex flex-col flex-1">
        <div className="flex items-center justify-between">
          <h2 className="font-medium text-2xl">{inscription.name}</h2>
          <InscriptionActions inscription={inscription} />
        </div>
        {inscription.collection && (
          <Link
            to={`/app/collection/${inscription.collection.symbol}`}
            className="mt-1 link link-primary link-hover text-lg"
          >
            {inscription.collection.name}
          </Link>
        )}
        <p className="whitespace-pre-wrap mt-4">{inscription.description}</p>
        {notAffiliatedWarning && <NotAffiliatedWarning className="mt-4" />}
        <Divider />
        <div className="flex flex-col lg:flex-row w-full">
          <div className="flex flex-col flex-1">
            <strong className="mb-1">Created by</strong>
            <AddressChip address={inscription.creator} />
          </div>
          <div className="flex flex-col flex-1 mt-6 lg:mt-0">
            <strong className="mb-1">Owned by</strong>
            <AddressChip address={inscription.current_owner} />
          </div>
        </div>

        <div className="flex flex-col mt-6">
          <strong>Created on</strong>
          <span>{format(inscription.date_created, DATETIME_FORMAT)}</span>
          <span>Block {inscription.height}</span>
        </div>
        <div className="flex flex-col mt-6">
          <strong>Transaction</strong>
          <TxLink txHash={inscription.transaction.hash} />
        </div>
        <Migration inscription={inscription} />
        {inscription.collection && (
          <div className="flex flex-col mt-6">
            <strong>Collection</strong>
            <Link
              to={`/app/collection/${inscription.collection.symbol}`}
              className="link link-primary link-hover"
            >
              {inscription.collection.name}
            </Link>
          </div>
        )}
        <AddToCollection inscription={inscription} />

        {inscription.rarity && (
          <div className="flex flex-col mt-6">
            <strong>Rarity</strong>
            <span>
              {inscription.rarity.rarity_rank} /{' '}
              {inscription.collection?.stats?.supply}
            </span>
          </div>
        )}

        {hasAttributes && (
          <div className="flex flex-col mt-6">
            <strong>Traits</strong>
            <div className="grid grid-cols-fill-10 gap-4 mt-2">
              {inscription.attributes!.map((attr: TraitItem) => (
                <Link
                  key={attr.trait_type}
                  className="btn btn-neutral h-[inherit] max-h-[inherit] py-2 flex flex-col"
                  to={
                    inscription.collection
                      ? `/app/collection/${inscription.collection.symbol}?${attr.trait_type}=${attr.value}&status=all`
                      : '/app/inscriptions'
                  }
                >
                  <span className="w-full text-nowrap overflow-hidden text-ellipsis capitalize leading-5">
                    {attr.trait_type}
                  </span>
                  <Badge
                    color="ghost"
                    className="inline w-full text-nowrap h-[inherit] overflow-hidden text-ellipsis"
                  >
                    {attr.value}
                  </Badge>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

const DEFAULT_SORT = { id: 'height', desc: true }

function InscriptionHistoryTable({
  history,
}: {
  history: InscriptionHistory[]
}) {
  const columnHelper = createColumnHelper<InscriptionHistory>()
  const [sorting, setSorting] = useSorting(DEFAULT_SORT)

  const columns = [
    columnHelper.accessor('date_created', {
      header: 'Date',
      cell: (info) => format(info.getValue(), DATETIME_FORMAT),
    }),
    columnHelper.accessor('height', {
      header: 'Block',
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor('action', {
      header: 'Action',
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor('sender', {
      header: 'Sender',
      cell: (info) => <Address address={info.getValue()} />,
    }),
    columnHelper.accessor('receiver', {
      header: 'Receiver',
      cell: (info) => <Address address={info.getValue() as string} />,
    }),
    columnHelper.accessor('transaction.hash', {
      header: '',
      enableSorting: false,
      cell: (info) => (
        <TxLink txHash={info.getValue()} title="View on Mintscan" />
      ),
    }),
  ]

  const table = useReactTable<InscriptionHistory>({
    columns,
    data: history,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    manualSorting: true,
  })

  return <Table table={table} showPagination={false} />
}

export default function InscriptionPage() {
  const data = useLoaderData<typeof loader>()
  return (
    <div className="flex flex-col">
      <BackHeader
        to={
          data.inscription.collection
            ? `/app/collection/${data.inscription.collection.symbol}`
            : `/app/inscriptions`
        }
      >
        Inscription #{data.inscription.inscription_number! - 1}
      </BackHeader>
      <InscriptionDetailComponent inscription={data.inscription} />
      <Divider className="mt-8" />
      <h2 className="font-medium text-lg">Transaction History</h2>
      <Divider />
      <InscriptionHistoryTable history={data.history} />
    </div>
  )
}
