'use client'

import { DayRow, type DayData } from './DayRow'
import { TotalRow } from './TotalRow'

interface WeekGroupProps {
  weekNumber: number
  days: DayData[]
  readOnly?: boolean
  onCellChange: (date: string, field: string, value: number) => void
}

export function WeekGroup({ weekNumber, days, readOnly = false, onCellChange }: WeekGroupProps) {
  return (
    <>
      {days.map((day, i) => (
        <DayRow
          key={day.date}
          day={day}
          weekLabel={i === 0 ? `Semaine ${weekNumber}` : ''}
          readOnly={readOnly}
          onCellChange={onCellChange}
        />
      ))}
      <TotalRow days={days} label={`Total S${weekNumber}`} />
    </>
  )
}
