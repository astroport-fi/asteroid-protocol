import { TxInscription } from '@asteroid-protocol/sdk'
import { toUtf8 } from '@cosmjs/encoding'
import { PencilSquareIcon } from '@heroicons/react/20/solid'
import { LoaderFunctionArgs, json } from '@remix-run/cloudflare'
import { useLoaderData } from '@remix-run/react'
import { Button, Form, Textarea } from 'react-daisyui'
import { useForm } from 'react-hook-form'
import { AsteroidClient } from '~/api/client'
import { InscribingNotSupportedWithLedger } from '~/components/alerts/InscribingNotSupportedWithLedger'
// import TxDialog from '~/components/dialogs/TxDialog'
import PostsList from '~/components/troll/Posts'
import { Wallet } from '~/components/wallet/Wallet'
// import { useDialogWithValue } from '~/hooks/useDialog'
import { useTrollBoxOperations } from '~/hooks/useOperations'
import useIsLedger from '~/hooks/wallet/useIsLedger'
import { parsePagination } from '~/utils/pagination'

export async function loader({ context, request }: LoaderFunctionArgs) {
  const { searchParams } = new URL(request.url)
  const { offset, limit } = parsePagination(searchParams)

  const asteroidClient = new AsteroidClient(context.cloudflare.env.ASTEROID_API)
  const res = await asteroidClient.getTrollPosts(offset, limit)

  return json({
    posts: res.posts,
    pages: Math.ceil(res.count / limit),
    total: res.count,
  })
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
  // const { dialogRef, value, showDialog } = useDialogWithValue<TxInscription>()

  const onSubmit = handleSubmit(async (data) => {
    if (!operations) {
      console.warn('No address')
      return
    }

    const txInscription = operations.post(toUtf8(data.text), {
      text: data.text,
      mime: 'text/plain',
    })

    // showDialog(txInscription)
  })

  const textError = errors.text

  return (
    <div className="flex flex-col w-full max-w-md">
      <Form onSubmit={onSubmit} className="flex flex-col mt-4 w-full">
        {isLedger && <InscribingNotSupportedWithLedger />}

        <div className="form-control w-full">
          <Textarea
            id="text"
            placeholder="Write your post here"
            color={textError ? 'error' : undefined}
            rows={5}
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
      </Form>
      {/* <TxDialog
        ref={dialogRef}
        txInscription={value}
        resultLink="/app/trollbox"
        resultCTA="View post"
        onSuccess={() => {
          reset()
        }}
      /> */}
    </div>
  )
}

export default function IndexPage() {
  const data = useLoaderData<typeof loader>()

  return (
    <div className="flex flex-col w-full">
      {data.posts.length < 1 && (
        <span className="p-4 text-center">{'No troll posts found'}</span>
      )}
      <div className="flex flex-col items-center">
        <PostsList posts={data.posts} className="h-[calc(100svh-20rem)]" />
        <CreatePostForm />
      </div>
    </div>
  )
}
