import { SVGProps } from 'react'

const PencilIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="1em"
    height="1em"
    viewBox="0 0 1200 1200"
    {...props}
  >
    <path
      fill="currentColor"
      d="M375 206.25h56.25v56.25H375zM543.75 37.5h112.5v56.25h-112.5zM768.75 206.25H825v56.25h-56.25zM768.75 206.25V150H712.5V93.75h-56.25V150h-112.5V93.75H487.5V150h-56.25v56.25zM375 1050h56.25v56.25H375zM431.25 1106.2h337.5v56.25h-337.5zM768.75 1050H825v56.25h-56.25zM825 262.5v56.25H375V262.5h-56.25V1050H375v-56.25h450V1050h56.25V262.5zm-450 675V375h112.5v562.5zm168.75 0V375h112.5v562.5zm281.25 0H712.5V375H825z"
    />
  </svg>
)
export default PencilIcon
