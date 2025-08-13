'use client'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Employee } from '@/hooks/useEmployees'

interface DeleteEmployeeDialogProps {
  employee: Employee | null
  isOpen: boolean
  onClose: () => void
  onConfirm: (employeeId: string) => Promise<void>
  isDeleting?: boolean
}

export default function DeleteEmployeeDialog({
  employee,
  isOpen,
  onClose,
  onConfirm,
  isDeleting = false,
}: DeleteEmployeeDialogProps) {
  const handleConfirm = async () => {
    if (employee) {
      await onConfirm(employee.id)
      onClose()
    }
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Supprimer l'employé</AlertDialogTitle>
          <AlertDialogDescription>
            Êtes-vous sûr de vouloir supprimer{' '}
            <strong>{employee?.fullName}</strong> ?{' '}
            Cette action ne peut pas être annulée.
            <br />
            <br />
            L'employé sera désactivé et ne sera plus visible dans la liste active,
            mais ses données historiques seront conservées.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>
            Annuler
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isDeleting}
            className="bg-red-600 hover:bg-red-700"
          >
            {isDeleting ? 'Suppression...' : 'Supprimer'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}