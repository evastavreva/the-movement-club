export type Session = {
  id: number
  classType: string
  instructor: string
  startTime: string
  duration: number
  available: boolean
}

export type BookingResult = { emailStatus: 'sent' | 'failed' | 'disabled' }

export class ApiError extends Error {
  status: number
  constructor(status: number) {
    super(`Request failed (${status})`)
    this.status = status
  }
}

export async function getSessions(): Promise<Session[]> {
  const response = await fetch('/api/sessions')
  if (!response.ok) throw new ApiError(response.status)
  return response.json()
}

export async function createSession(session: Pick<Session, 'classType' | 'instructor' | 'startTime' | 'duration'>): Promise<void> {
  const response = await fetch('/api/sessions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(session),
  })
  if (!response.ok) throw new ApiError(response.status)
}

export async function bookSession(id: number, booking: { name: string; email: string }): Promise<BookingResult> {
  const response = await fetch(`/api/sessions/${id}/book`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(booking),
  })
  if (!response.ok) throw new ApiError(response.status)
  return response.json()
}
