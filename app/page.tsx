'use client'

import { useEffect, useMemo, useState } from 'react'
import { Bell, Check, ChevronDown, Clock3, Headphones, MapPin, Menu, MoreHorizontal, Pause, Play, Plus, RotateCcw, Send, Sparkles, Ticket, UserRound, Users, Volume2, X } from 'lucide-react'

type Mode = 'participant' | 'provider'
type TicketState = 'draft' | 'waiting' | 'serving' | 'done'
type QueueItem = { token: string; name: string; reason: string; type: string; wait: number; status: 'waiting' | 'serving' | 'done'; urgent?: boolean }
type Intake = { category: string; intent: string; urgency: 'low' | 'normal' | 'high'; summary: string; suggestedService: string; response: string }

const initialQueue: QueueItem[] = [
  { token: 'A-104', name: 'Maya R.', reason: 'Prescription pickup', type: 'Health', wait: 8, status: 'serving' },
  { token: 'A-105', name: 'Jordan K.', reason: 'Update address', type: 'Civic', wait: 14, status: 'waiting', urgent: true },
  { token: 'A-106', name: 'Sam T.', reason: 'New patient visit', type: 'Health', wait: 22, status: 'waiting' },
  { token: 'A-107', name: 'You', reason: 'Service request', type: 'General', wait: 31, status: 'waiting' },
]

const examples = ['I need to renew my library card', 'Can I see a nurse about my prescription?', 'I have an appointment at 2:30']

function Pill({ children, tone = 'neutral' }: { children: React.ReactNode; tone?: 'neutral' | 'blue' | 'coral' | 'green' }) {
  return <span className={`pill pill-${tone}`}>{children}</span>
}

function Progress({ value }: { value: number }) {
  return <div className="progress-track" aria-label={`${value}% complete`}><div className="progress-value" style={{ width: `${value}%` }} /></div>
}

function QueueRow({ item, onCall, onComplete }: { item: QueueItem; onCall: () => void; onComplete: () => void }) {
  return <div className="queue-row">
    <div className="token-small">{item.token}</div>
    <div className="queue-person"><strong>{item.name}</strong><span>{item.reason}</span></div>
    <Pill tone={item.urgent ? 'coral' : item.status === 'serving' ? 'blue' : 'neutral'}>{item.urgent ? 'Priority' : item.status === 'serving' ? 'In service' : `${item.wait} min`}</Pill>
    <div className="row-actions">{item.status === 'waiting' && <button className="icon-button" aria-label={`Call ${item.token}`} onClick={onCall}><Volume2 size={16} /></button>}{item.status === 'serving' && <button className="text-button" onClick={onComplete}><Check size={15} /> Complete</button>}<button className="icon-button" aria-label="More options"><MoreHorizontal size={18} /></button></div>
  </div>
}

export default function Page() {
  const [mode, setMode] = useState<Mode>('participant')
  const [request, setRequest] = useState('')
  const [intake, setIntake] = useState<Intake | null>(null)
  const [ticketState, setTicketState] = useState<TicketState>('draft')
  const [queue, setQueue] = useState(initialQueue)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [paused, setPaused] = useState(false)
  const [notified, setNotified] = useState(true)

  const myTicket = queue.find((item) => item.name === 'You')
  const position = Math.max(1, queue.filter((item) => item.status === 'waiting' && item.token !== 'A-107').findIndex((item) => item.token === 'A-107') + 2)
  const wait = myTicket?.wait ?? 31
  const activeCount = queue.filter((item) => item.status !== 'done').length
  const averageWait = Math.round(queue.filter((item) => item.status === 'waiting').reduce((sum, item) => sum + item.wait, 0) / Math.max(1, queue.filter((item) => item.status === 'waiting').length))

  useEffect(() => {
    if (paused || ticketState !== 'waiting') return
    const timer = window.setInterval(() => setQueue((current) => current.map((item) => item.name === 'You' ? { ...item, wait: Math.max(4, item.wait - 1) } : item)), 12000)
    return () => window.clearInterval(timer)
  }, [paused, ticketState])

  const submitRequest = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!request.trim()) return
    setLoading(true); setError('')
    try {
      const response = await fetch('/api/intake', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: request }) })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error)
      setIntake(data); setTicketState('draft')
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'Something went wrong.') } finally { setLoading(false) }
  }

  const joinQueue = () => {
    setTicketState('waiting')
    setQueue((current) => current.map((item) => item.name === 'You' ? { ...item, reason: intake?.summary || 'Service request', type: intake?.category || 'General', wait: 31 } : item))
  }
  const leaveQueue = () => { setTicketState('draft'); setIntake(null); setRequest('') }
  const callNext = () => setQueue((current) => { const next = current.find((item) => item.status === 'waiting'); return current.map((item) => item === next ? { ...item, status: 'serving' } : item) })
  const completeServing = (token: string) => setQueue((current) => current.map((item) => item.token === token ? { ...item, status: 'done' } : item))
  const queueLabel = useMemo(() => ticketState === 'serving' ? 'You are being served' : ticketState === 'waiting' ? 'You are in line' : 'Ready when you are', [ticketState])

  return <main className="app-shell">
    <header className="topbar">
      <div className="brand"><div className="brand-mark"><span /><span /><span /></div><span>queue<span className="brand-kind">kind</span></span></div>
      <div className="location"><MapPin size={15} /><span>Oakland Community Hub</span><ChevronDown size={14} /></div>
      <nav className="top-actions"><div className="mode-switch" aria-label="Switch view"><button className={mode === 'participant' ? 'active' : ''} onClick={() => setMode('participant')}><UserRound size={14} /> Visitor</button><button className={mode === 'provider' ? 'active' : ''} onClick={() => setMode('provider')}><Headphones size={14} /> Provider</button></div><button className="icon-button notification" aria-label="Notifications"><Bell size={18} /><i /></button><div className="avatar">JR</div><button className="mobile-menu" aria-label="Open menu"><Menu size={20} /></button></nav>
    </header>

    {mode === 'participant' ? <div className="content-grid">
      <section className="left-column">
        <div className="eyebrow"><Sparkles size={14} /> AI-assisted intake</div>
        <h1>Skip the line.<br /><em>Keep your place.</em></h1>
        <p className="lede">Tell us what you need in your own words. We will find the right service and hold your place while you wait.</p>
        <form className="intake-form" onSubmit={submitRequest}>
          <label htmlFor="request">What brings you in today?</label>
          <div className="textarea-wrap"><textarea id="request" value={request} onChange={(event) => setRequest(event.target.value)} placeholder="e.g. I need help renewing my library card..." rows={4} maxLength={1000} /><button className="send-button" type="submit" disabled={loading || !request.trim()} aria-label="Understand my request">{loading ? <RotateCcw className="spin" size={18} /> : <Send size={18} />}</button></div>
          {error && <p className="error-text">{error}</p>}
          <div className="examples"><span>Try saying</span>{examples.map((example) => <button key={example} type="button" onClick={() => setRequest(example)}>{example}</button>)}</div>
        </form>
        <div className="trust-note"><div className="trust-icon"><Users size={17} /></div><p><strong>Designed for everyone.</strong> No app or account needed. Your request stays private.</p></div>
      </section>

      <section className="center-column">
        <div className="section-heading"><div><span className="section-kicker">Your queue</span><h2>{queueLabel}</h2></div><Pill tone="green"><i className="live-dot" /> Live</Pill></div>
        <div className={`ticket-card ${ticketState === 'draft' ? 'ticket-empty' : ''}`}>
          {ticketState === 'draft' && !intake ? <div className="empty-state"><div className="empty-ticket"><Ticket size={23} /></div><h3>Your digital ticket will appear here</h3><p>Share what you need and we will organize the next step.</p></div> : <>
            <div className="ticket-top"><div><span className="section-kicker">Oakland Community Hub</span><h3>{intake?.suggestedService || 'Information desk'}</h3></div><div className="ticket-icon"><Ticket size={22} /></div></div>
            {intake && <div className="ai-summary"><Sparkles size={15} /><span>{intake.response}</span></div>}
            <div className="ticket-token"><span>Your token</span><strong>{myTicket?.token || 'A-107'}</strong><Pill tone={ticketState === 'serving' ? 'blue' : 'coral'}>{ticketState === 'serving' ? 'Now serving' : ticketState === 'waiting' ? 'Waiting' : 'Not joined'}</Pill></div>
            {ticketState !== 'draft' && <><div className="wait-stats"><div><span>People ahead</span><strong>{position}</strong></div><div><span>Est. wait</span><strong>~{wait} min</strong></div><div><span>Updated</span><strong>Just now</strong></div></div><Progress value={ticketState === 'serving' ? 86 : 26} /></>}
            <div className="ticket-actions">{ticketState === 'draft' ? <button className="primary-button" onClick={joinQueue}><Plus size={17} /> Join this queue</button> : ticketState === 'waiting' ? <><button className="secondary-button" onClick={() => setNotified(!notified)}><Bell size={16} /> {notified ? 'Notifications on' : 'Notify me'}</button><button className="quiet-button" onClick={leaveQueue}>Leave queue</button></> : <button className="primary-button" onClick={() => setTicketState('done')}><Check size={17} /> Mark complete</button>}</div>
          </>}
        </div>
        <div className="arrival-note"><Clock3 size={16} /><span>We will alert you when you are <strong>2 places away.</strong> You can step out or explore nearby.</span></div>
      </section>

      <aside className="right-column"><div className="flow-header"><div><span className="section-kicker">Live at the hub</span><h2>Today&apos;s flow</h2></div><button className="icon-button" aria-label="More flow options"><MoreHorizontal size={18} /></button></div><div className="flow-card"><div className="flow-stat"><span className="flow-number">{activeCount}</span><span>people in line<br /><small>across 3 services</small></span></div><div className="mini-bars"><div style={{ height: '42%' }} /><div style={{ height: '68%' }} /><div style={{ height: '54%' }} /><div style={{ height: '82%' }} /><div style={{ height: '61%' }} /><div style={{ height: '90%' }} /><div style={{ height: '74%' }} /></div><div className="flow-footer"><span><i className="live-dot" /> Moving smoothly</span><span>Avg. wait {averageWait} min</span></div></div><div className="service-list"><div className="service-item"><div className="service-icon coral"><Ticket size={17} /></div><div><strong>General services</strong><span>Walk-ins · {queue.filter((item) => item.type === 'General').length + 2} in line</span></div><b>~18m</b></div><div className="service-item"><div className="service-icon blue"><Plus size={17} /></div><div><strong>Health &amp; wellness</strong><span>Appointments · 4 in line</span></div><b>~24m</b></div><div className="service-item"><div className="service-icon green"><Check size={17} /></div><div><strong>Civic support</strong><span>Walk-ins · 2 in line</span></div><b>~9m</b></div></div><div className="hub-detail"><MapPin size={16} /><div><strong>Oakland Community Hub</strong><span>250 Franklin St · Open until 6:00 PM</span></div><button aria-label="Open hub details"><ChevronDown size={16} /></button></div></aside>
    </div> : <div className="provider-view"><div className="provider-heading"><div><span className="section-kicker">Provider command center</span><h1>Good morning, Jordan.</h1><p>Here&apos;s what&apos;s happening at Oakland Community Hub.</p></div><button className={paused ? 'secondary-button' : 'primary-button'} onClick={() => setPaused(!paused)}>{paused ? <Play size={17} /> : <Pause size={17} />} {paused ? 'Resume intake' : 'Pause intake'}</button></div><div className="provider-stats"><div className="provider-stat"><span>Active queue</span><strong>{activeCount}</strong><small><Users size={14} /> +3 since 9:00</small></div><div className="provider-stat"><span>Average wait</span><strong>{averageWait}<small> min</small></strong><small><Clock3 size={14} /> 4 min faster today</small></div><div className="provider-stat"><span>Now serving</span><strong>{queue.find((item) => item.status === 'serving')?.token || '—'}</strong><small><Ticket size={14} /> General services</small></div><div className="provider-stat highlight"><span>Next up</span><strong>{queue.find((item) => item.status === 'waiting')?.token || '—'}</strong><button onClick={callNext}><Volume2 size={15} /> Call next</button></div></div><div className="queue-panel"><div className="panel-heading"><div><span className="section-kicker">Live queue</span><h2>All visitors</h2></div><div className="panel-controls"><button className="secondary-button"><Plus size={16} /> Add visitor</button><button className="icon-button"><MoreHorizontal size={18} /></button></div></div><div className="queue-table-header"><span>Token</span><span>Visitor</span><span>Status</span><span>Actions</span></div>{queue.map((item) => <QueueRow key={item.token} item={item} onCall={() => setQueue((current) => current.map((entry) => entry.token === item.token ? { ...entry, status: 'serving' } : entry))} onComplete={() => completeServing(item.token)} />)}</div></div>}
    <footer className="footer"><span>QueueKind</span><span>Making waiting more human.</span><span className="footer-right"><button>Accessibility</button><button>Privacy</button></span></footer>
  </main>
}
