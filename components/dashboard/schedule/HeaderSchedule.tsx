import { Button } from '@/components/ui/button'
import { Download, Settings, Upload } from 'lucide-react'

interface HeaderScheduleProps {
  title?: string
  subtitle?: string
  showActions?: boolean
}

export default function HeaderSchedule({
  title = 'Planning des Employés',
  subtitle = 'Gérer les plannings et les affectations des employés',
  showActions = true,
}: HeaderScheduleProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
        <p className="mt-1 text-gray-600">{subtitle}</p>
      </div>

      {/* {showActions && (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Import
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <Upload className="h-4 w-4" />
            Export
          </Button>
          <Button size="sm" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </Button>
        </div>
      )} */}
    </div>
  )
}
