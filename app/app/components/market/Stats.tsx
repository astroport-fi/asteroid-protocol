import { Token } from '~/api/token'
import Stat from '~/components/Stat'
import AtomValue from '../AtomValue'

export default function Stats({ token }: { token: Token }) {
  return (
    <div className="flex flex-row gap-8 mt-4">
      <Stat title="Price">
        <AtomValue value={token.last_price_base} horizontal />
      </Stat>
      <Stat title="24H Volume">
        <AtomValue value={token.volume_24_base} horizontal />
      </Stat>
    </div>
  )
}
