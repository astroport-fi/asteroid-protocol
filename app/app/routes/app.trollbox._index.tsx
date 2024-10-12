import { TxInscription } from '@asteroid-protocol/sdk'
import { toUtf8 } from '@cosmjs/encoding'
import { PencilSquareIcon } from '@heroicons/react/20/solid'
import { LoaderFunctionArgs, json } from '@remix-run/cloudflare'
import { useLoaderData } from '@remix-run/react'
import { Button, ChatBubble, Form, Textarea } from 'react-daisyui'
import { useForm } from 'react-hook-form'
import { AsteroidClient } from '~/api/client'
import { TrollPost } from '~/api/trollbox'
import CollectPost from '~/components/CollectPost'
import DecimalText from '~/components/DecimalText'
import { InscribingNotSupportedWithLedger } from '~/components/alerts/InscribingNotSupportedWithLedger'
import TxDialog from '~/components/dialogs/TxDialog'
import SearchInputForm from '~/components/form/SearchInput'
import { Wallet } from '~/components/wallet/Wallet'
import { useDialogWithValue } from '~/hooks/useDialog'
import { useTrollBoxOperations } from '~/hooks/useOperations'
import useIsLedger from '~/hooks/wallet/useIsLedger'
import { parsePagination } from '~/utils/pagination'
import { shortAddress } from '~/utils/string'

export async function loader({ context, request }: LoaderFunctionArgs) {
  const { searchParams } = new URL(request.url)
  const { offset, limit } = parsePagination(searchParams)
  const search = searchParams.get('search')

  const asteroidClient = new AsteroidClient(context.cloudflare.env.ASTEROID_API)
  const res = await asteroidClient.getTrollPosts(offset, limit, { search })

  return json({
    posts: res.posts,
    pages: Math.ceil(res.count / limit),
    total: res.count,
  })
}

function Post({ post }: { post: TrollPost }) {
  const mintedAmount =
    post.launchpad?.mint_reservations_aggregate?.aggregate?.max?.token_id ?? 0
  const price = 1000 * (mintedAmount + 1)

  return (
    <div className="flex items-center p-4">
      <ChatBubble>
        <ChatBubble.Avatar
          letters={shortAddress(post.creator)}
          color="neutral"
          shape="circle"
          size="sm"
        />
        <ChatBubble.Message>{post.text}</ChatBubble.Message>
        <ChatBubble.Footer className="flex items-center opacity-100">
          <CollectPost trollPost={post} price={price} />
          <span className="mx-2">•</span>
          <DecimalText value={price} decimalScale={6} suffix=" ATOM" />
          <span className="mx-2">•</span>
          <span>{mintedAmount} / 100 minted</span>
        </ChatBubble.Footer>
      </ChatBubble>
    </div>
  )
}

function PostsList({ posts }: { posts: TrollPost[] }) {
  return (
    <div className="flex flex-col w-full items-center overflow-y-auto h-[calc(100svh-44rem)]">
      {posts.map((post) => (
        <Post key={post.id} post={post} />
      ))}
    </div>
  )
}

type FormData = {
  text: string
}

function CreatePostForm() {
  const operations = useTrollBoxOperations()
  const isLedger = useIsLedger()

  // form
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormData>()

  // dialog
  const { dialogRef, value, showDialog } = useDialogWithValue<TxInscription>()

  const onSubmit = handleSubmit(async (data) => {
    if (!operations) {
      console.warn('No address')
      return
    }

    const txInscription = operations.post(toUtf8(data.text), {
      text: data.text,
      mime: 'text/plain',
    })

    showDialog(txInscription)
  })

  const textError = errors.text

  return (
    <div className="flex flex-col w-full max-w-md">
      <Form onSubmit={onSubmit} className="flex flex-col mt-4">
        {isLedger && <InscribingNotSupportedWithLedger />}

        <div className="flex flex-1 flex-col">
          <div className="form-control w-full">
            <Textarea
              id="text"
              placeholder="Write your post here"
              color={textError ? 'error' : undefined}
              rows={10}
              required
              {...register('text', { required: true, minLength: 10 })}
            />
            <label className="label" htmlFor="text">
              <span className="label-text-alt text-error">
                {textError &&
                  (textError.message
                    ? textError.message
                    : 'Text is required and must at least 10 characters long.')}
              </span>
            </label>
          </div>

          {isLedger ? (
            <Button type="button" className="mt-4">
              Inscribing is not supported when using Ledger
            </Button>
          ) : operations ? (
            <Button
              type="submit"
              color="primary"
              className="mt-4"
              startIcon={<PencilSquareIcon className="size-5" />}
            >
              Create
            </Button>
          ) : (
            <Wallet className="mt-4 btn-md w-full" color="primary" />
          )}
        </div>
      </Form>
      <TxDialog
        ref={dialogRef}
        txInscription={value}
        resultLink="/app/trollbox"
        resultCTA="View post"
        onSuccess={() => {
          reset()
        }}
      />
    </div>
  )
}

export default function TrollBoxPage() {
  const data = useLoaderData<typeof loader>()

  return (
    <div className="flex flex-col w-full max-w-[1920px] overflow-y-scroll">
      <div className="flex justify-end">
        <SearchInputForm placeholder="Search by text" />
      </div>
      {data.posts.length < 1 && (
        <span className="p-4">{'No troll posts found'}</span>
      )}
      <div className="flex flex-col items-center">
        <PostsList posts={data.posts} />
        <CreatePostForm />
      </div>
    </div>
  )
}
