import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { createSession, getSessions } from './api'
import type { Session } from './api'
import { dateKey, studioStartTime } from './calendarDates'
import SessionCalendar from './SessionCalendar'

const classTypes = ['Reformer Pilates', 'Mat Pilates', 'Vinyasa Yoga', 'Hatha Yoga']
const instructors = ['Eva', 'Sofia', 'Anastasia', 'Ioanna']
const sessionDate = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Europe/Vienna', dateStyle: 'medium', timeStyle: 'short',
})

export default function Admin() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [formError, setFormError] = useState('')
  const [message, setMessage] = useState('')
  const [now] = useState(() => Date.now())
  const today = dateKey(now)

  useEffect(() => {
    let active = true
    getSessions().then(
      (data) => { if (active) { setSessions(data); setLoading(false) } },
      () => { if (active) { setError('Couldn’t load sessions. Please refresh.'); setLoading(false) } },
    )
    return () => { active = false }
  }, [])

  async function refresh() {
    setLoading(true)
    setError('')
    try { setSessions(await getSessions()) }
    catch { setError('Couldn’t load sessions. Please try again.') }
    finally { setLoading(false) }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (saving) return
    const form = event.currentTarget
    const values = new FormData(form)
    setFormError('')
    setMessage('')
    let startTime: string
    try {
      startTime = studioStartTime(String(values.get('date')), String(values.get('time')))
      if (new Date(startTime).getTime() <= Date.now()) {
        setFormError('Choose a future date and time.')
        return
      }
    } catch {
      setFormError('Choose a valid Vienna date and time. This time may fall in the daylight-saving clock change.')
      return
    }
    setSaving(true)
    try {
      await createSession({
        classType: String(values.get('classType')),
        instructor: String(values.get('instructor')),
        startTime,
        duration: Number(values.get('duration')),
      })
      form.reset()
      setMessage('Session created. It is now available in the customer calendar.')
      // Reload so booked statuses and any concurrent changes stay current.
      await refresh()
    } catch {
      setFormError('Couldn’t create the session. Please try again.')
    } finally { setSaving(false) }
  }

  return <main className="admin-page">
    <header className="admin-header flex flex-wrap items-center justify-between gap-4">
      <div><p className="eyebrow">THE MOVEMENT CLUB · ADMIN</p><h1>Studio schedule.</h1></div>
      <a className="week-button" href="/">← Customer calendar</a>
    </header>
    <section className="admin-form-panel" aria-labelledby="create-heading">
      <h2 id="create-heading">Create a private session.</h2>
      <p className="admin-note">Dates and times are in Vienna time. Each session is for one customer.</p>
      <form className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" onSubmit={submit}>
        <label>Class type<select name="classType" required disabled={saving}>
          {classTypes.map((type) => <option key={type}>{type}</option>)}
        </select></label>
        <label>Instructor<select name="instructor" required disabled={saving}>
          {instructors.map((name) => <option key={name}>{name}</option>)}
        </select></label>
        <label>Duration (minutes)<input name="duration" type="number" min="1" step="1" defaultValue="60" required disabled={saving} /></label>
        <label>Date<input name="date" type="date" min={today} required disabled={saving} /></label>
        <label>Start time<input name="time" type="time" required disabled={saving} /></label>
        <button className="primary-button admin-submit" disabled={saving}>{saving ? 'Creating…' : 'Create session ↗'}</button>
      </form>
      {formError && <p className="error-message" role="alert">{formError}</p>}
      {message && <p className="admin-success" role="status">{message}</p>}
    </section>
    <section className="admin-calendar" aria-labelledby="schedule-heading" aria-busy={loading}>
      <h2 id="schedule-heading">Weekly schedule.</h2>
      <p className="admin-note">All sessions, booked and unbooked. Times are shown in Vienna time.</p>
      {loading && <p className="admin-note" role="status">Updating schedule…</p>}
      <SessionCalendar sessions={sessions} saving={saving || loading} now={now} admin />
    </section>
    <section aria-labelledby="all-sessions-heading">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 id="all-sessions-heading">All sessions.</h2>
        <button className="week-button" disabled={loading || saving} onClick={refresh}>Refresh status</button>
      </div>
      {error && <p className="error-message" role="alert">{error}</p>}
      {loading ? <p className="admin-note" role="status">Loading sessions…</p>
        : sessions.length === 0 ? <p className="empty-state">No sessions yet. Create your first session above.</p>
          : <div className="admin-table-scroll" role="region" aria-label="All sessions and booking statuses" tabIndex={0}>
            <table className="admin-table">
              <thead><tr><th scope="col">Class</th><th scope="col">Instructor</th><th scope="col">Date & time · Vienna</th><th scope="col">Duration</th><th scope="col">Booking status</th></tr></thead>
              <tbody>{sessions.map((session) => <tr key={session.id}>
                <td>{session.classType}</td><td>{session.instructor}</td>
                <td><time dateTime={session.startTime}>{sessionDate.format(new Date(session.startTime))}</time></td>
                <td>{session.duration} min</td>
                <td><span className={`status-badge ${session.available ? '' : 'is-booked'}`}>{session.available ? 'Unbooked' : 'Booked'}</span></td>
              </tr>)}</tbody>
            </table>
          </div>}
    </section>
  </main>
}
