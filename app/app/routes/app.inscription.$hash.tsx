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
import { Divider } from 'react-daisyui'
import { AsteroidClient } from '~/api/client'
import { InscriptionHistory, InscriptionWithMarket } from '~/api/inscription'
import Address from '~/components/Address'
import AddressChip from '~/components/AddressChip'
import { InscriptionActions } from '~/components/InscriptionActions'
import InscriptionImage from '~/components/InscriptionImage'
import TxLink from '~/components/TxLink'
import Table from '~/components/table'
import useSorting from '~/hooks/useSorting'
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

  const history = await asteroidClient.getInscriptionHistory(inscription.id, {
    [sort]: direction,
  })

  return json({ inscription, history })
}

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  if (!data) {
    return []
  }

  return inscriptionMeta(data.inscription)
}

function InscriptionDetail({
  inscription,
}: {
  inscription: InscriptionWithMarket
}) {
  return (
    <div className="flex flex-row w-full">
      <div className="flex flex-1 flex-col px-16 items-center">
        <InscriptionImage
          mime={inscription.mime}
          src={inscription.content_path}
          isExplicit={inscription.is_explicit}
          className="rounded-xl max-w-lg object-contain"
        />
        <Link
          to={`/inscription/${inscription.transaction.hash}`}
          className="btn btn-link"
        >
          Open in viewer <ArrowTopRightOnSquareIcon className="size-5" />
        </Link>
      </div>
      <div className="flex flex-col flex-1">
        <div className="flex items-center justify-between">
          <h2 className="font-medium text-2xl">{inscription.name}</h2>
          <InscriptionActions inscription={inscription} />
        </div>
        <p className="whitespace-pre-wrap mt-4">{inscription.description}</p>
        <Divider />
        <div className="flex flex-row w-full">
          <div className="flex flex-col flex-1">
            <strong className="mb-1">Created by</strong>
            <AddressChip address={inscription.creator} />
          </div>
          <div className="flex flex-col flex-1">
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
      </div>
    </div>
  )
}

const DEFAULT_SORT = { id: 'height', desc: true }

function InscriptionHistoryComponent({
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
      <InscriptionDetail inscription={data.inscription} />
      <Divider className="mt-8" />
      <h2 className="font-medium text-lg">Transaction History</h2>
      <Divider />
      <InscriptionHistoryComponent history={data.history} />
    </div>
  )
}
