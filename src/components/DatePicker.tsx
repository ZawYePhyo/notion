import { useState } from 'react'
import { format, addDays, startOfToday } from 'date-fns'

interface DatePickerProps {
  selectedDate: Date
  onDateChange: (date: Date) => void
  daysToShow?: number
}

export function DatePicker({ selectedDate, onDateChange, daysToShow = 7 }: DatePickerProps) {
  const today = startOfToday()
  const dates = Array.from({ length: daysToShow }, (_, i) => addDays(today, i))

  return (
    <div style={{
      display: 'flex',
      gap: '0.5rem',
      overflowX: 'auto',
      padding: '1rem 0',
      marginBottom: '1.5rem'
    }}>
      {dates.map((date) => {
        const isSelected = format(date, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd')
        const isToday = format(date, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')

        return (
          <button
            key={date.toISOString()}
            onClick={() => onDateChange(date)}
            style={{
              padding: '1rem',
              minWidth: '80px',
              borderRadius: '0.5rem',
              backgroundColor: isSelected ? '#3b82f6' : 'white',
              color: isSelected ? 'white' : '#1f2937',
              border: isToday ? '2px solid #3b82f6' : '1px solid #e5e7eb',
              cursor: 'pointer',
              transition: 'all 0.2s',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.25rem'
            }}
          >
            <div style={{ fontSize: '0.875rem', opacity: 0.8 }}>
              {format(date, 'EEE')}
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>
              {format(date, 'd')}
            </div>
            <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>
              {format(date, 'MMM')}
            </div>
          </button>
        )
      })}
    </div>
  )
}
