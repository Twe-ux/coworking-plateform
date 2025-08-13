import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart3, Calendar, Users } from 'lucide-react'

export default function StatisticsCardsSchedule({
  activeEmployees,
  shiftsThisWeek,
  totalHoursThisWeek,
  coveragePercentage,
}: {
  activeEmployees: number
  shiftsThisWeek: number
  totalHoursThisWeek: number
  coveragePercentage: number
}) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Active Employees
          </CardTitle>
          <Users className="text-muted-foreground h-4 w-4" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{activeEmployees}</div>
          <p className="text-muted-foreground text-xs">
            Currently active staff members
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Shifts This Week
          </CardTitle>
          <Calendar className="text-muted-foreground h-4 w-4" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{shiftsThisWeek}</div>
          <p className="text-muted-foreground text-xs">Scheduled shifts</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
          <BarChart3 className="text-muted-foreground h-4 w-4" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {totalHoursThisWeek.toFixed(1)}h
          </div>
          <p className="text-muted-foreground text-xs">Scheduled this week</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Coverage</CardTitle>
          <Users className="text-muted-foreground h-4 w-4" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{coveragePercentage}%</div>
          <p className="text-muted-foreground text-xs">
            Weekly schedule coverage
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
