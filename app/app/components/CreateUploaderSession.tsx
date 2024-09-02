import { ArrowUpIcon } from '@heroicons/react/20/solid'
import { Button } from 'react-daisyui'
import useUploaderSession from '~/hooks/useUploaderSession'

export default function CreateUploaderSession() {
  const { createSession } = useUploaderSession()

  return (
    <Button
      type="button"
      onClick={createSession}
      color="primary"
      className="mt-4"
      startIcon={<ArrowUpIcon className="size-5" />}
    >
      Sign authorization message
    </Button>
  )
}
