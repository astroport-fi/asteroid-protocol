import { type LoaderFunctionArgs, json } from '@remix-run/cloudflare'
import { Form, useLoaderData } from '@remix-run/react'
import { Button } from 'react-daisyui'

const key = '__my-key__'

export async function loader({ context }: LoaderFunctionArgs) {
  const { MY_KV } = context.env
  const value = await MY_KV.get(key)
  return json({ value })
}

export default function Index() {
  const { value } = useLoaderData<typeof loader>()
  return <div>Index</div>
}
