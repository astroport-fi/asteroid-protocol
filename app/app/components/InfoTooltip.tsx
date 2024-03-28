import { InformationCircleIcon } from '@heroicons/react/24/outline'
import { Tooltip, TooltipProps } from 'react-daisyui'

export default function InfoTooltip(props: TooltipProps) {
  return (
    <Tooltip {...props}>
      <InformationCircleIcon className="size-5" />
    </Tooltip>
  )
}
