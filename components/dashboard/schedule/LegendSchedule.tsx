import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function LegendSchedule({
  SHIFT_TYPES,
}: {
  SHIFT_TYPES: Record<string, { label: string; time: string; color: string }>
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Shift Types</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Object.entries(SHIFT_TYPES).map(([key, shift]) => (
            <div
              key={key}
              className={`rounded-lg p-2 text-center ${shift.color}`}
            >
              <div className="text-sm font-medium">{shift.label}</div>
              <div className="text-xs opacity-75">{shift.time}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
