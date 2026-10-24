const studioDate = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Vienna' })
const studioHour = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Vienna', hour: '2-digit', hourCycle: 'h23' })

export function dateKey(value: string | number | Date) {
  return studioDate.format(new Date(value))
}

export function weekDays(now: number, offset: number) {
  // Calendar dates use UTC noon so week navigation stays stable across DST changes.
  const monday = new Date(`${dateKey(now)}T12:00:00Z`)
  monday.setUTCDate(monday.getUTCDate() - (monday.getUTCDay() + 6) % 7 + offset * 7)
  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(monday)
    day.setUTCDate(day.getUTCDate() + index)
    return day
  })
}

export function periodOf(startTime: string) {
  const hour = Number(studioHour.format(new Date(startTime)))
  return hour < 12 ? 'Morning' : hour < 17 ? 'Afternoon' : 'Evening'
}

export function studioStartTime(date: string, time: string) {
  const clock = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Vienna', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  })
  // Vienna uses UTC+1 or UTC+2. Validate the local time to reject the spring DST gap.
  for (const offset of ['+02:00', '+01:00']) {
    const instant = new Date(`${date}T${time}:00${offset}`)
    if (dateKey(instant) === date && clock.format(instant) === time) return instant.toISOString()
  }
  throw new Error('Invalid Vienna date or time')
}
