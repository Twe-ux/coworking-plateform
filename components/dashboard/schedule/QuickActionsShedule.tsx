import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Calendar, Download, Plus, Users } from 'lucide-react'

export default function QuickActionsSchedule({
  openShiftModal,
  handleAddEmployee,
  canManageEmployees = true,
  canCreateShifts = true,
}: {
  openShiftModal: (date: Date) => void
  handleAddEmployee: () => void
  canManageEmployees?: boolean
  canCreateShifts?: boolean
}) {
  return (
    <Card className="border-2 border-dashed border-gray-200">
      <CardContent className="pt-6">
        <div className="space-y-4 text-center">
          <h3 className="text-lg font-medium text-gray-900">Quick Actions</h3>
          <div className="flex flex-wrap justify-center gap-2">
            {canCreateShifts && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => openShiftModal(new Date())}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Today's Shift
              </Button>
            )}
            {canManageEmployees && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleAddEmployee}
                className="flex items-center gap-2"
              >
                <Users className="h-4 w-4" />
                Add Employee
              </Button>
            )}
            {canManageEmployees && (
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <Calendar className="h-4 w-4" />
                View Reports
              </Button>
            )}
            {canManageEmployees && (
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Export Schedule
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
