import { BackHeader } from '~/components/Back'
import UploadInscriptionsPage, {
  loader,
} from './app.create.launch.($symbol).inscriptions'

export default function EditLaunchpadInscriptionsPage() {
  return (
    <div className="flex flex-col overflow-y-scroll">
      <BackHeader to="/app/wallet/collections">
        Edit collection launchpad inscriptions
      </BackHeader>
      <UploadInscriptionsPage />
    </div>
  )
}

export { loader }
