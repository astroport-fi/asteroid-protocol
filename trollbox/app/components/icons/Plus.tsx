import { SVGProps } from 'react'

const PlusIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="1em"
    height="1em"
    viewBox="0 0 1200 1200"
    {...props}
  >
    <path
      fill="currentColor"
      d="M649.99 550V400h-100v150h-150v100h150v150h100V650h150V550z"
    />
    <path
      fill="currentColor"
      d="M1050 200v-49.996h-50v-50H200v50h-50V200h-50v800h50v50.004h50v50h800v-50h50V1000h50V200zm-50 700h-50v50h-50v49.996H300V950h-50v-50h-50V300h50v-50h50v-50.004h600V250h50v50h50z"
    />
  </svg>
)
export default PlusIcon
