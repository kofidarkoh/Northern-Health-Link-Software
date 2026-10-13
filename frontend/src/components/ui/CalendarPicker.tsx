import { useState, useMemo } from 'react'
import { View, StyleSheet, Pressable, ScrollView } from 'react-native'
import { Text, IconButton } from 'react-native-paper'
import { Colors, Spacing } from '../../constants'

interface CalendarPickerProps {
  selectedDate: string
  selectedTime: string
  onDateChange: (date: string) => void
  onTimeChange: (time: string) => void
}

const TIME_SLOTS = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
  '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
  '17:00', '17:30',
]

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

export function CalendarPicker({ selectedDate, selectedTime, onDateChange, onTimeChange }: CalendarPickerProps) {
  const today = new Date()
  const [viewDate, setViewDate] = useState(today)

  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()

  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDayOfWeek = new Date(year, month, 1).getDay()

  const days = useMemo(() => {
    const arr: (number | null)[] = []
    for (let i = 0; i < firstDayOfWeek; i++) arr.push(null)
    for (let d = 1; d <= daysInMonth; d++) arr.push(d)
    return arr
  }, [firstDayOfWeek, daysInMonth])

  function formatDate(y: number, m: number, d: number): string {
    return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
  }

  function isToday(d: number): boolean {
    return d === today.getDate() && month === today.getMonth() && year === today.getFullYear()
  }

  function isSelected(d: number): boolean {
    return selectedDate === formatDate(year, month, d)
  }

  function isPast(d: number): boolean {
    const date = new Date(year, month, d)
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    return date < todayStart
  }

  function prevMonth() {
    setViewDate(new Date(year, month - 1, 1))
  }

  function nextMonth() {
    setViewDate(new Date(year, month + 1, 1))
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <IconButton icon="chevron-left" size={20} onPress={prevMonth} />
        <Text variant="titleMedium" style={styles.monthTitle}>
          {MONTHS[month]} {year}
        </Text>
        <IconButton icon="chevron-right" size={20} onPress={nextMonth} />
      </View>

      <View style={styles.weekdayRow}>
        {WEEKDAYS.map((day) => (
          <Text key={day} style={styles.weekday}>{day}</Text>
        ))}
      </View>

      <View style={styles.grid}>
        {days.map((day, idx) => (
          <Pressable
            key={idx}
            style={[
              styles.dayCell,
              day && isSelected(day) ? styles.daySelected : undefined,
              day && isToday(day) ? styles.dayToday : undefined,
              day && isPast(day) ? styles.dayPast : undefined,
            ]}
            onPress={() => {
              if (day && !isPast(day)) {
                onDateChange(formatDate(year, month, day))
              }
            }}
            disabled={!day || isPast(day)}
          >
            {day ? (
              <Text
                style={[
                  styles.dayText,
                  isSelected(day) && styles.dayTextSelected,
                  isPast(day) && styles.dayTextPast,
                ]}
              >
                {day}
              </Text>
            ) : null}
          </Pressable>
        ))}
      </View>

      {selectedDate ? (
        <View style={styles.timeSection}>
          <Text variant="labelMedium" style={styles.timeLabel}>Select Time</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.timeSlots}>
            {TIME_SLOTS.map((slot) => (
              <Pressable
                key={slot}
                style={[styles.timeSlot, selectedTime === slot && styles.timeSlotSelected]}
                onPress={() => onTimeChange(slot)}
              >
                <Text style={[styles.timeSlotText, selectedTime === slot && styles.timeSlotTextSelected]}>
                  {slot}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  monthTitle: { fontWeight: '700', color: Colors.text },
  weekdayRow: { flexDirection: 'row', marginBottom: Spacing.xs },
  weekday: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
  },
  daySelected: { backgroundColor: Colors.primary },
  dayToday: { borderWidth: 1.5, borderColor: Colors.secondary },
  dayPast: { opacity: 0.3 },
  dayText: { fontSize: 14, color: Colors.text, fontWeight: '500' },
  dayTextSelected: { color: Colors.white, fontWeight: '700' },
  dayTextPast: { color: Colors.textLight },

  timeSection: { marginTop: Spacing.md },
  timeLabel: { fontWeight: '600', color: Colors.text, marginBottom: Spacing.sm },
  timeSlots: { gap: Spacing.sm },
  timeSlot: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.backgroundAlt,
  },
  timeSlotSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  timeSlotText: { fontSize: 13, fontWeight: '600', color: Colors.text },
  timeSlotTextSelected: { color: Colors.white },
})
