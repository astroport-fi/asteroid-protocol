import { toUtf8 } from '@cosmjs/encoding'
import { PencilSquareIcon } from '@heroicons/react/20/solid'
import { LoaderFunctionArgs, json } from '@remix-run/cloudflare'
import { useLoaderData, useNavigate } from '@remix-run/react'
import { useMemo } from 'react'
import { Button, Form, Textarea } from 'react-daisyui'
import { useForm } from 'react-hook-form'
import { AsteroidClient } from '~/api/client'
import { InscribingNotSupportedWithLedger } from '~/components/alerts/InscribingNotSupportedWithLedger'
import PostsInfiniteScroll from '~/components/troll/PostsInfiniteScroll'
import { Wallet } from '~/components/wallet/Wallet'
import { useTrollBoxOperations } from '~/hooks/useOperations'
import useToastSubmitTx from '~/hooks/useToastSubmitTx'
import useIsLedger from '~/hooks/wallet/useIsLedger'
import { parsePagination } from '~/utils/pagination'

export async function loader({ context, request }: LoaderFunctionArgs) {
  const { searchParams } = new URL(request.url)
  const { offset, limit, page } = parsePagination(searchParams)

  const asteroidClient = new AsteroidClient(context.cloudflare.env.ASTEROID_API)
  const res = await asteroidClient.getTrollPosts(offset, limit)

  return json({
    posts: res.posts,
    pages: Math.ceil(res.count / limit),
    total: res.count,
    page,
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
    watch,
  } = useForm<FormData>()

  const text = watch('text')

  const txInscription = useMemo(() => {
    if (!operations || !text) {
      return null
    }
    return operations.post(toUtf8(text), {
      text: text,
      mime: 'text/plain',
    })
  }, [operations, text])

  const navigate = useNavigate()
  const { sendTx } = useToastSubmitTx(txInscription, {
    onSuccess: () => {
      reset()
      navigate({ hash: '' }, { replace: true })
    },
    successMessage: 'Post created',
  })

  const onSubmit = handleSubmit(async () => {
    sendTx()
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
            {...register('text', { required: true, minLength: 5 })}
          />
          <label className="label" htmlFor="text">
            <span className="label-text-alt text-error">
              {textError &&
                (textError.message
                  ? textError.message
                  : 'Text is required and must at least 5 characters long.')}
            </span>
          </label>
        </div>

        {isLedger ? (
          <Button type="button" className="mt-4">
            Ledger is not supported at the moment
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
          <Wallet className="btn-md w-full" color="primary" />
        )}
      </Form>
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
        <div
          id="scrollableDiv"
          className="overflow-y-scroll h-[calc(100svh-20rem)]"
        >
          <PostsInfiniteScroll
            posts={data.posts}
            count={data.total}
            page={data.page}
          />
        </div>
        <CreatePostForm />
      </div>
    </div>
  )
}
