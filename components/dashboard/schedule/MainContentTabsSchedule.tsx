import EmployeeList from '@/components/employee-scheduling/EmployeeList'
import EmployeeScheduling from '@/components/employee-scheduling/EmployeeScheduling'
import { type Employee } from '@/hooks/useEmployees'
import { type Shift } from '@/hooks/useShifts'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Calendar, Plus, Users } from 'lucide-react'

export default function MainContentTabsSchedule({
  employees,
  shifts,
  activeTab,
  setActiveTab,
  openShiftModal,
  handleEmployeeSelect,
  handleEmployeeEdit,
  handleAddEmployee,
  canManageEmployees = true,
  userRole = '',
}: {
  employees: Employee[]
  shifts: Shift[]
  activeTab: string
  setActiveTab: (tab: string) => void
  openShiftModal: (date: Date) => void
  handleEmployeeSelect: (employee: Employee) => void
  handleEmployeeEdit: (employee: Employee) => void
  handleAddEmployee: () => void
  canManageEmployees?: boolean
  userRole?: string
}) {
  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="">
      <TabsList
        className={`grid w-full ${canManageEmployees ? 'grid-cols-2' : 'grid-cols-1'}`}
      >
        <TabsTrigger value="schedule" className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          Planning
        </TabsTrigger>
        {canManageEmployees && (
          <TabsTrigger value="employees" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Employés
          </TabsTrigger>
        )}
      </TabsList>

      <TabsContent value="schedule" className="">
        {/* <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Gestion des Plannings</h2>
          {canManageEmployees && (
            <Button
              onClick={() => openShiftModal(new Date())}
              className="bg-coffee-primary hover:bg-coffee-primary/90 flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Ajouter un créneau
            </Button>
          )}
        </div> */}

        <EmployeeScheduling
          className="w-full"
          employees={employees}
          shifts={shifts}
          onAddShift={canManageEmployees ? openShiftModal : undefined}
          readOnly={!canManageEmployees}
          userRole={userRole}
        />
      </TabsContent>

      {canManageEmployees && (
        <TabsContent value="employees" className="space-y-4">
          <EmployeeList
            onEmployeeSelect={handleEmployeeSelect}
            onEmployeeEdit={handleEmployeeEdit}
          />
        </TabsContent>
      )}
    </Tabs>
  )
}
