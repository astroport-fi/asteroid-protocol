import type { TxInscription } from '@asteroid-protocol/sdk'
import { forwardRef } from 'react'
import { Button, Form, Modal } from 'react-daisyui'
import { useForm } from 'react-hook-form'
import { Inscription } from '~/api/inscription'
import { useDialogWithValue } from '~/hooks/useDialog'
import useForwardRef from '~/hooks/useForwardRef'
import { useInscriptionOperations } from '~/hooks/useOperations'
import CosmosAddressInput from '../form/CosmosAddressInput'
import TxDialog from './TxDialog'

interface Props {
  inscription: Inscription
}

type FormData = {
  grantee: string
}

const GrantMigrationPermissionDialog = forwardRef<HTMLDialogElement, Props>(
  function GrantMigrationPermissionDialog({ inscription }, ref) {
    // form
    const {
      handleSubmit,
      register,
      watch,
      formState: { errors },
    } = useForm<FormData>({ defaultValues: { grantee: '' } })
    const grantee = watch('grantee')

    const operations = useInscriptionOperations()
    const fRef = useForwardRef(ref)

    // dialog
    const { dialogRef, value, showDialog } = useDialogWithValue<TxInscription>()

    const onSubmit = handleSubmit(async (data) => {
      if (!operations) {
        console.warn('No address')
        return
      }

      const txInscription = operations.grantMigrationPermission(
        inscription.transaction.hash,
        data.grantee,
      )

      fRef.current?.close()
      showDialog(txInscription)
    })

    return (
      <Modal ref={ref} backdrop>
        <Modal.Header className="text-center">
          Grant migration permission
        </Modal.Header>
        <Modal.Body>
          <p>
            Granting migration permission allows another user to migrate the
            inscription on your behalf.
          </p>
          <Form onSubmit={onSubmit} className="flex flex-col items-center">
            <CosmosAddressInput
              register={register}
              name="grantee"
              error={errors.grantee}
              title="Grantee address"
              value={grantee}
              className="mt-6"
            />

            <Button color="primary" type="submit" className="mt-4">
              Grant permission
            </Button>
          </Form>
          <TxDialog
            txInscription={value}
            ref={dialogRef}
            resultCTA="View transaction"
            resultLink={`/app/inscription/${inscription.transaction.hash}`}
          />
        </Modal.Body>
        <Modal.Actions className="flex justify-center">
          <form method="dialog" className="flex flex-col">
            <Button className="no-underline" variant="link">
              Close
            </Button>
          </form>
        </Modal.Actions>
      </Modal>
    )
  },
)
export default GrantMigrationPermissionDialog
