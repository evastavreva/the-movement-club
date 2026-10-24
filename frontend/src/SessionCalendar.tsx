import { useState } from 'react'
import type { Session } from './api'
import { dateKey, periodOf, weekDays } from './calendarDates'

const dayLabel = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Vienna', weekday: 'short' })
const monthLabel = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Vienna', month: 'long', year: 'numeric' })
const fullDate = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Vienna', day: 'numeric', month: 'short', year: 'numeric' })
const timeLabel = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Vienna', hour: '2-digit', minute: '2-digit' })
const periods = ['Morning', 'Afternoon', 'Evening']

type Props = {
  sessions: Session[]
  selectedId?: number
  saving: boolean
  now: number
  onSelect: (session: Session) => void
}

export default function SessionCalendar({ sessions, selectedId, saving, now, onSelect }: Props) {
  const [weekOffset, setWeekOffset] = useState(0)
  const [chosenDay, setChosenDay] = useState('')
  const days = weekDays(now, weekOffset)
  const keys = days.map(dateKey)
  const weekly = sessions.filter((session) => keys.includes(dateKey(session.startTime)))
    .sort((a, b) => a.startTime.localeCompare(b.startTime))
  const firstMonth = monthLabel.format(days[0])
  const lastMonth = monthLabel.format(days[6])

  const defaultDay = dateKey(weekly[0]?.startTime ?? now)
  const activeDay = keys.includes(chosenDay) ? chosenDay : keys.includes(defaultDay) ? defaultDay : keys[0]
  const daily = weekly.filter((session) => dateKey(session.startTime) === activeDay)

  function renderSession(session: Session) {
    return <button
                    key={session.id}
                    className={`calendar-session ${selectedId === session.id ? 'is-selected' : ''}`}
                    data-class={session.classType}
                    disabled={saving}
                    aria-pressed={selectedId === session.id}
                    aria-label={`Book ${session.classType} with ${session.instructor}, ${fullDate.format(new Date(session.startTime))} at ${timeLabel.format(new Date(session.startTime))}, ${session.duration} minutes`}
                    onClick={() => onSelect(session)}
                  >
                    <strong>{timeLabel.format(new Date(session.startTime))} · {session.duration} min</strong>
                    <span className="calendar-class">{session.classType}</span>
                    <span>with {session.instructor}</span>
                    <span className="calendar-book">{selectedId === session.id ? 'Selected ✓' : 'Book private session ↗'}</span>
                  </button>
  }

  return <div className="calendar">
    <div className="calendar-toolbar flex flex-wrap items-center justify-between gap-4">
      <div aria-live="polite">
        <h3>{firstMonth === lastMonth ? firstMonth : `${firstMonth} – ${lastMonth}`}</h3>
        <p>{fullDate.format(days[0])} – {fullDate.format(days[6])}</p>
      </div>
      <nav className="flex flex-wrap gap-2" aria-label="Calendar weeks">
        <button className="week-button" disabled={saving || weekOffset === 0} onClick={() => setWeekOffset(weekOffset - 1)}>← Previous week</button>
        {weekOffset > 0 && <button className="week-button" disabled={saving} onClick={() => setWeekOffset(0)}>This week</button>}
        <button className="week-button" disabled={saving} onClick={() => setWeekOffset(weekOffset + 1)}>Next week →</button>
      </nav>
    </div>
    <p className="result-count" role="status">{weekly.length} available {weekly.length === 1 ? 'session' : 'sessions'} this week</p>
    {weekly.length === 0 && <p className="calendar-empty">No sessions match this week. Try another week or change your filters.</p>}
    <div className="mobile-calendar">
      <div className="mobile-week" role="group" aria-label="Choose a day">
        {days.map((day, index) => <button key={keys[index]}
          className={`mobile-day ${activeDay === keys[index] ? 'is-active' : ''}`}
          aria-label={fullDate.format(day)} aria-pressed={activeDay === keys[index]}
          disabled={saving} onClick={() => setChosenDay(keys[index])}>
          <span>{dayLabel.format(day)}</span>
          <time dateTime={keys[index]} aria-current={keys[index] === dateKey(now) ? 'date' : undefined}>{day.getUTCDate()}</time>
          <span className={`day-dot ${weekly.some((session) => dateKey(session.startTime) === keys[index]) ? 'has-sessions' : ''}`} aria-hidden="true" />
        </button>)}
      </div>
      <div className="mobile-agenda" aria-live="polite">
        <h4>{fullDate.format(new Date(`${activeDay}T12:00:00Z`))}</h4>
        {daily.length === 0 ? <p className="calendar-empty">No available sessions on this day. Choose another day above.</p>
          : periods.map((period) => {
            const slots = daily.filter((session) => periodOf(session.startTime) === period)
            return slots.length > 0 && <section className="mobile-period" aria-label={period} key={period}>
              <h5>{period}</h5>
              <div className="grid gap-3">{slots.map(renderSession)}</div>
            </section>
          })}
      </div>
    </div>
    <p className="calendar-scroll-hint">Swipe or scroll sideways to see all seven days.</p>
    <div className="calendar-scroll" role="region" aria-label="Weekly session calendar" tabIndex={0}>
      <div className="calendar-grid">
        {days.map((day, index) => <div className={`calendar-day ${keys[index] === dateKey(now) ? 'is-today' : ''}`} key={keys[index]}>
          <span>{dayLabel.format(day)}</span>
          <time dateTime={keys[index]} aria-current={keys[index] === dateKey(now) ? 'date' : undefined}>{day.getUTCDate()}</time>
        </div>)}
        {periods.map((period) => <div className="calendar-period" key={period}>
          <h4>{period}<span>{period === 'Morning' ? 'Before 12:00' : period === 'Afternoon' ? '12:00 – 17:00' : 'From 17:00'}</span></h4>
          <div className="calendar-row">
            {keys.map((key) => {
              const slots = weekly.filter((session) => dateKey(session.startTime) === key && periodOf(session.startTime) === period)
              return <div className="calendar-cell" key={key}>
                {slots.length === 0 ? <span className="no-session" aria-label={`No ${period.toLowerCase()} sessions on ${key}`}>—</span>
                  : slots.map(renderSession)}
              </div>
            })}
          </div>
        </div>)}
      </div>
    </div>
  </div>
}
