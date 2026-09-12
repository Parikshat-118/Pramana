import React, { useState, useEffect, useCallback } from 'react'
import { report } from './data/report.js'
import Overview from './components/Overview.jsx'
import Ladder from './components/Ladder.jsx'
import Reversal from './components/Reversal.jsx'
import Contributors from './components/Contributors.jsx'
import Certificate from './components/Certificate.jsx'
import Disposition from './components/Disposition.jsx'
import Ledger from './components/Ledger.jsx'
import Coverage from './components/Coverage.jsx'

const SCREENS = [
  { id: 'overview',     idx: '00', group: 'Assessment',  label: 'Summary',             component: Overview },
  { id: 'ladder',       idx: '01',                       label: 'Precision ladder',    component: Ladder },
  { id: 'reversal',     idx: '02',                       label: 'Trigger reversal',    component: Reversal },
  { id: 'contributors', idx: '03', group: 'Attribution', label: 'Contributors',        component: Contributors },
  { id: 'certificate',  idx: '04',                       label: 'Supplier certificate', component: Certificate },
  { id: 'disposition',  idx: '05', group: 'Governance',  label: 'Disposition',         component: Disposition },
  { id: 'ledger',       idx: '06',                       label: 'Ledger & anchor',     component: Ledger },
  { id: 'coverage',     idx: '07',                       label: 'Coverage & limits',   component: Coverage },
]

/** The nearest group heading at or above a screen, for the breadcrumb. */
function groupOf(index) {
  for (let i = index; i >= 0; i--) if (SCREENS[i].group) return SCREENS[i].group
  return ''
}

function LiveClock() {
  const [now, setNow] = useState(new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])
  const hh = String(now.getHours()).padStart(2, '0')
  const mm = String(now.getMinutes()).padStart(2, '0')
  const ss = String(now.getSeconds()).padStart(2, '0')
  return <span className="topbar-clock">{hh}:{mm}:{ss} IST</span>
}

export default function App() {
  const [screenId, setScreenId] = useState('overview')

  // The receipt monitor can move the certificate's state after release, so the monitor lives
  // here and the disposition is derived from it: the header, the summary and the governance
  // screen cannot disagree.
  const [monitor, setMonitor] = useState({
    value: report.receipt_monitor.e_process_value,
    receipts: report.receipt_monitor.receipts_since_enrolment,
  })
  const quarantined = monitor.value >= report.receipt_monitor.threshold
  const dispositionState = quarantined ? 'QUARANTINE' : report.disposition.state

  const index = SCREENS.findIndex(s => s.id === screenId)
  const screen = SCREENS[index]
  const Screen = screen.component
  const prev = SCREENS[index - 1]
  const next = SCREENS[index + 1]

  const go = useCallback(id => {
    setScreenId(id)
    window.scrollTo({ top: 0 })
  }, [])

  // Arrow keys walk the screens in order, so a review pass needs no mouse.
  useEffect(() => {
    const onKey = e => {
      if (e.target instanceof HTMLInputElement) return
      if (e.key === 'ArrowRight' && next) go(next.id)
      if (e.key === 'ArrowLeft' && prev) go(prev.id)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [go, next, prev])

  return (
    <div className="app">
      <aside className="sidebar">
          <div className="brand" onClick={() => go('overview')} style={{ cursor: 'pointer' }}>
          <span className="brand-name">PRAMANA</span>
          <span className="brand-dev">प्रमाण</span>
        </div>
        <div className="brand-line">
          Behavioural integrity assurance for multi-contributor computer vision pipelines
        </div>

        <nav className="nav" aria-label="Report sections">
          {SCREENS.map(s => (
            <React.Fragment key={s.id}>
              {s.group && <div className="nav-group">{s.group}</div>}
              <button
                className={`nav-item${screenId === s.id ? ' active' : ''}`}
                onClick={() => go(s.id)}
                aria-current={screenId === s.id ? 'page' : undefined}
              >
                <span className="nav-idx">{s.idx}</span>
                <span>{s.label}</span>
              </button>
            </React.Fragment>
          ))}
        </nav>

        <div className="sidebar-foot">
          <div><span>Battery</span><span>gen {report.battery.generation}</span></div>
          <div><span>Null</span><span>n=64</span></div>
          <div><span>Chain</span><span>{report.ledger.chain_position}</span></div>
        </div>
      </aside>

      <main className="main">
        <div className="topbar">
          <span className="crumb">
            {screen.group || groupOf(index)} / <b>{screen.label}</b>
          </span>
          <div className="topbar-spacer" />
          <span className="topbar-id">{report.report_id}</span>
          <span className="topbar-sep">·</span>
          <span className="topbar-tag">T{report.assessment.tier.slice(1)} · training data</span>
          <span className="topbar-sep">·</span>
          <span className="topbar-tag">Ed25519 signed</span>
          <span className="topbar-sep">·</span>
          <span className={`topbar-tag${quarantined ? ' topbar-tag--crit' : ''}`}>
            {dispositionState.replace(/_/g, ' ')}
          </span>
          <span className="topbar-sep">·</span>
          <LiveClock />
        </div>

        <div className="content">
          <Screen
            go={go}
            dispositionState={dispositionState}
            monitor={monitor}
            setMonitor={setMonitor}
          />

          <nav className="pager" aria-label="Section navigation">
            {prev ? (
              <button onClick={() => go(prev.id)}>
                <div className="pager-dir">← Previous</div>
                <div className="pager-name">{prev.label}</div>
              </button>
            ) : <div style={{ flex: 1 }} />}
            {next ? (
              <button onClick={() => go(next.id)}>
                <div className="pager-dir">Next →</div>
                <div className="pager-name">{next.label}</div>
              </button>
            ) : <div style={{ flex: 1 }} />}
          </nav>
        </div>
      </main>
    </div>
  )
}
