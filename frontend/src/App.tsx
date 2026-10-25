import { useEffect, useRef, useState } from 'react'
import { ApiError, getSessions, bookSession } from './api'
import type { BookingResult, Session } from './api'
import type { FormEvent } from 'react'
import SessionCalendar from './SessionCalendar'
import './App.css'

const dateFormat = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Europe/Vienna', weekday: 'short', day: 'numeric', month: 'long',
})
const timeFormat = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Europe/Vienna', hour: '2-digit', minute: '2-digit',
})

const practices = [
  { name: 'Mat Pilates', pace: 'Focused · Mat-based', description: 'Practice controlled movements on a mat using your own body weight, sometimes with small props. Expect floor exercises that bring attention to your core, alignment, and breath.' },
  { name: 'Reformer Pilates', pace: 'Controlled · Equipment-based', description: 'Move on a sliding carriage with adjustable springs for support and resistance. Expect precise, guided movements using the footbar, straps, and carriage.' },
  { name: 'Vinyasa Yoga', pace: 'Flowing · Breath-led', description: 'Link poses together in a flowing sequence, moving with your breath. Expect transitions between standing poses, balances, and mat work, followed by a quiet rest.' },
  { name: 'Hatha Yoga', pace: 'Unhurried · Steady', description: 'Explore poses one at a time, with space to settle into each position. Expect a slower pace, attention to alignment, breathing exercises, and a relaxing finish.' },
]

function SessionDetails({ session }: { session: Session }) {
  return <div className="booking-summary">
    <strong>{session.classType}</strong><p>with {session.instructor}</p>
    <p>{dateFormat.format(new Date(session.startTime))} · {timeFormat.format(new Date(session.startTime))}</p>
    <p>{session.duration} minutes · Vienna time</p>
  </div>
}

function App() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [now, setNow] = useState(() => Date.now())
  const nameInput = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [classType, setClassType] = useState('')
  const [instructor, setInstructor] = useState('')
  const [selected, setSelected] = useState<Session | null>(null)
  const [saving, setSaving] = useState(false)
  const [bookingError, setBookingError] = useState('')
  const [confirmation, setConfirmation] = useState<BookingResult & { name: string; session: Session } | null>(null)

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 60_000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => { if (selected) nameInput.current?.focus() }, [selected])

  async function loadSessions() {
    setLoading(true)
    setError('')
    try {
      setSessions(await getSessions())
    } catch {
      setError('We couldn’t load the schedule. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let active = true
    getSessions().then(
      (data) => { if (active) { setSessions(data); setLoading(false) } },
      () => { if (active) { setError('We couldn’t load the schedule. Please try again.'); setLoading(false) } },
    )
    return () => { active = false }
  }, [])

  const available = sessions.filter((session) => session.available && new Date(session.startTime).getTime() > now)
  const visible = available.filter((session) =>
    (!classType || session.classType === classType) && (!instructor || session.instructor === instructor),
  )
  const classTypes = [...new Set(sessions.map((session) => session.classType))].sort()
  const instructors = [...new Set(sessions.map((session) => session.instructor))].sort()

  async function submitBooking(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selected || saving) return
    const form = new FormData(event.currentTarget)
    const name = String(form.get('name')).trim()
    const email = String(form.get('email')).trim()
    if (Array.from(name).length < 2) { setBookingError('Please enter your full name (at least 2 characters).'); return }
    setSaving(true)
    setBookingError('')
    try {
      const result = await bookSession(selected.id, { name, email })
      setConfirmation({ ...result, name, session: selected })
      setSessions((current) => current.map((session) => session.id === selected.id ? { ...session, available: false } : session))
      setSelected(null)
    } catch (error) {
      if (error instanceof ApiError && (error.status === 409 || error.status === 404)) {
        setSessions((current) => current.filter((session) => session.id !== selected.id))
        setSelected(null)
        setBookingError('That session is no longer available. Please choose another time.')
      } else {
        setBookingError('We couldn’t confirm your booking. Please try again.')
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <main>
        <section className="hero">
          <p className="hero-tagline">PILATES · YOGA · WELLNESS</p>
          <h1>the movement club.</h1>
          <a className="primary-button inline-flex" href="#sessions">Find your flow</a>
        </section>
        <section id="sessions" className="sessions-section">
          <p className="eyebrow">YOUR TIME TO MOVE</p>
          <div className="section-heading flex flex-wrap items-end justify-between gap-4">
            <h2>Find your next session.</h2><p>All times shown in Vienna time.</p>
          </div>
          <div className="filters grid gap-4 sm:grid-cols-2">
            <label>Class type<select value={classType} disabled={saving} onChange={(event) => setClassType(event.target.value)}>
              <option value="">All class types</option>
              {classTypes.map((type) => <option key={type}>{type}</option>)}
            </select></label>
            <label>Instructor<select value={instructor} disabled={saving} onChange={(event) => setInstructor(event.target.value)}>
              <option value="">All instructors</option>
              {instructors.map((name) => <option key={name}>{name}</option>)}
            </select></label>
          </div>
          <div className="booking-layout grid items-start gap-6">
            <div aria-busy={loading}>
              {loading ? <p className="empty-state" role="status">Finding your next moment of calm…</p>
                : error ? <div className="empty-state" role="alert"><p>{error}</p><button className="text-button" onClick={loadSessions}>Try again</button></div>
                  : <>
                    <SessionCalendar sessions={visible} selectedId={selected?.id} saving={saving} now={now}
                      onSelect={(session) => { setSelected(session); setConfirmation(null); setBookingError('') }} />
                    {(classType || instructor) && <button className="text-button" disabled={saving} onClick={() => { setClassType(''); setInstructor('') }}>Clear filters</button>}
                  </>}
            </div>
            <aside className="booking-panel" aria-label="Your booking">
              {confirmation ? <div role="status"><p className="eyebrow">YOU’RE BOOKED</p><h2>See you on the mat,<br /><em>{confirmation.name}.</em></h2><p>Your private session is confirmed.</p>
                {confirmation.message && <div className="confirmation-bubble">
                  <p className="eyebrow">{confirmation.aiGenerated ? 'PREPARE FOR YOUR SESSION · AI TIPS' : 'PREPARE FOR YOUR SESSION'}</p>
                  <p>{confirmation.message}</p>
                </div>}
                <SessionDetails session={confirmation.session} />
                {confirmation.emailStatus === 'sent' && <p>Your confirmation email is on its way. Please check your inbox and spam folder.</p>}
                {confirmation.emailStatus === 'failed' && <p>Your booking is saved, but we couldn’t send the email. Please keep these session details.</p>}
                <button className="text-button" onClick={() => setConfirmation(null)}>Explore more sessions</button>
              </div> : selected ? <>
                <p className="eyebrow">MAKE TIME FOR YOURSELF</p><h2>Your session.</h2>
                <SessionDetails session={selected} />
                <form key={selected.id} onSubmit={submitBooking} className="grid gap-4">
                  <label>Full name<input ref={nameInput} name="name" autoComplete="name" minLength={2} required disabled={saving} /></label>
                  <label>Email address<input name="email" type="email" autoComplete="email" required disabled={saving} /></label>
                  {bookingError && <p className="error-message" role="alert">{bookingError}</p>}
                  <button className="primary-button" disabled={saving}>{saving ? 'Confirming…' : 'Confirm booking ↗'}</button>
                  <button type="button" className="text-button" disabled={saving} onClick={() => { setSelected(null); setBookingError('') }}>Cancel</button>
                </form>
              </> : <>
                <p className="eyebrow">A PRACTICE THAT’S PERSONAL</p><h2>Just you.<br /><em>And your practice.</em></h2><p>Choose a session to reserve your one-on-one time with an instructor.</p>
                <div className="panel-divider" /><p className="small-copy">No account needed. Just your name, your email, and a little time for yourself.</p>
                {bookingError && <p className="error-message" role="alert">{bookingError}</p>}
              </>}
            </aside>
          </div>
        </section>
        <section className="practice-section" aria-labelledby="practice-heading">
          <p className="eyebrow">FOUR WAYS TO MOVE</p>
          <h2 id="practice-heading">Find your practice.</h2>
          <p className="practice-intro">A different rhythm for every day. Every session is one-on-one, with your instructor guiding the practice around you.</p>
          <div className="grid gap-4 sm:grid-cols-2">
            {practices.map((practice) => <article className="practice-card" data-class={practice.name} key={practice.name}>
              <img
                className="practice-image"
                src={`/images/classes/${practice.name.toLowerCase().replaceAll(' ', '-')}.jpg`}
                alt={`A woman practicing ${practice.name} in a softly lit studio`}
                width="1200" height="800" loading="lazy" decoding="async"
              />
              <div className="practice-copy">
                <p className="eyebrow">{practice.pace}</p>
                <h3>{practice.name}</h3>
                <p>{practice.description}</p>
              </div>
            </article>)}
          </div>
        </section>
      </main>
      <footer className="flex flex-wrap items-center justify-between gap-4"><span>THE MOVEMENT CLUB</span><p>A little movement. A little more you.</p><a className="text-button" href="/admin">Studio admin</a></footer>
    </>
  )
}

export default App
