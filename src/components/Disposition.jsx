import React, { useState, useRef, useEffect } from 'react'
import {
  PageHead, Section, Block, Status, Metrics, Metric, DL, Bar, Callout, Toolbar, Term,
} from './ui.jsx'
import { report } from '../data/report.js'

const DISP = report.disposition
const RM = report.receipt_monitor

const LATTICE = [
  { state: 'ACCEPT', kind: 'ok', desc: 'No finding at any assessed rung' },
  { state: 'ACCEPT_WITH_CONDITIONS', kind: 'ok', desc: 'Finding contained, controls attached' },
  { state: 'CONDITIONAL_RELEASE', kind: 'warn', desc: 'Named authority, controls and an expiry date' },
  { state: 'QUARANTINE', kind: 'crit', desc: 'Withheld pending investigation' },
  { state: 'REJECT', kind: 'crit', desc: 'Returned to the supplier' },
]

export default function Disposition({ monitor, setMonitor }) {
  const [running, setRunning] = useState(false)
  const timer = useRef(null)

  const e = monitor.value
  const receipts = monitor.receipts
  const crossed = e >= RM.threshold
  const ceiling = RM.threshold * 1.4

  useEffect(() => () => clearInterval(timer.current), [])

  const play = () => {
    if (running) { clearInterval(timer.current); setRunning(false); return }
    setRunning(true)
    timer.current = setInterval(() => {
      setMonitor(prev => {
        const next = prev.value * 1.22 + 0.4
        if (next >= ceiling) {
          clearInterval(timer.current)
          setRunning(false)
          return { value: ceiling, receipts: prev.receipts + 137 }
        }
        return { value: next, receipts: prev.receipts + 137 }
      })
    }, 260)
  }

  const reset = () => {
    clearInterval(timer.current)
    setRunning(false)
    setMonitor({ value: RM.e_process_value, receipts: RM.receipts_since_enrolment })
  }

  return (
    <>
      <PageHead
        title="Disposition"
        subtitle="Release decision and post-release monitoring"
        meta={<>State <span className="id">{crossed ? 'QUARANTINE' : DISP.state}</span> · authority {DISP.risk_accepted_by.authority} · accepted <span className="id">{DISP.risk_accepted_by.utc}</span></>}
      />

      <Toolbar hint={crossed
        ? 'Threshold crossed. Disposition moved to QUARANTINE and the acceptance was revoked.'
        : `Monitor running on ${receipts.toLocaleString()} receipts since enrolment.`}>
        <button className={running ? '' : 'primary'} onClick={play} disabled={crossed}>
          {running ? 'Pause' : 'Advance receipt stream'}
        </button>
        <button onClick={reset} disabled={!crossed && e === RM.e_process_value}>Reset</button>
      </Toolbar>

      <Metrics>
        <Metric
          label="Disposition"
          value={(crossed ? 'QUARANTINE' : DISP.state).replace(/_/g, ' ')}
          tone={crossed ? 'crit' : 'warn'} sm
          context={crossed
            ? <>Moved by the monitor, not by a new assessment</>
            : <>Expires 11 Dec 2026 · 3 controls</>}
        />
        <Metric
          label="Monitor value" value={e.toFixed(1)} tone={crossed ? 'crit' : 'ok'}
          context={<>Threshold <b>{RM.threshold.toFixed(1)}</b> · {crossed ? 'crossed' : 'no alarm'}</>}
        />
        <Metric
          label="Receipts since enrolment" value={receipts.toLocaleString()}
          context={<>Each signs the model digest, rung, ledger digest and input digest</>}
        />
        <Metric
          label="False alarms on replay"
          value={`${RM.false_alarms_on_drift_replay.alarms} / ${RM.false_alarms_on_drift_replay.budget}`}
          tone="ok"
          context={<>Budget spent on benign drift <b>before</b> detection is claimed</>}
        />
      </Metrics>

      {crossed && (
        <Callout kind="crit" label="Certificate state changed · re-assessment required">
          Nothing was retrained and no new assessment was run. A signed certificate moved to
          QUARANTINE on its own, and the named authority's risk acceptance moved with it —{' '}
          <span className="id">risk_acceptance: REVOKED</span> is now a ledger row carrying the
          monitor value that caused it.
        </Callout>
      )}

      <Section title="State lattice" meta="5 states">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th style={{ width: 260 }}>State</th>
                <th>Meaning</th>
                <th style={{ width: 100 }}>Current</th>
              </tr>
            </thead>
            <tbody>
              {LATTICE.map(l => {
                const active = l.state === (crossed ? 'QUARANTINE' : DISP.state)
                return (
                  <tr key={l.state} className={active ? 'selected' : 'muted'}>
                    <td className="t-id">{l.state}</td>
                    <td className="t-wrap">{l.desc}</td>
                    <td>{active && <Status kind={l.kind}>active</Status>}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <p className="section-note" style={{ marginTop: 10, marginBottom: 0 }}>
          A gate that can only refuse gets waived once and then ignored. This one records the
          override — who accepted the risk, what was attached to it, and when it lapses.
        </p>
      </Section>

      <Section
        title="Receipt-stream monitor"
        meta={crossed ? 'alarm' : 'within bounds'}
        note="A weighted conformal test martingale over the signed receipt stream. No labels, nothing retrained, and anytime-valid — it may be inspected or stopped at any moment without invalidating the guarantee."
      >
        <div className="cols cols-2-1">
          <div>
            <Bar
              value={Math.min(e, ceiling)} max={ceiling}
              tone={crossed ? 'crit' : 'dark'}
              label={<><Term id="martingale">Monitor</Term> against threshold</>}
              right={`${e.toFixed(1)} / ${RM.threshold.toFixed(1)}`}
            />
            <hr className="r" />
            <DL left rows={[
              ['Statistic', <span className="id">{RM.statistic}</span>],
              ['Null hypothesis', <span className="id">{RM.null_hypothesis}</span>],
              ['Anytime valid', <Status kind="ok">true</Status>],
              ['Declared assumptions', 'bag sufficiency · weight model on a correlated stream'],
              ['Detection delay bound', <span className="mute">not stated — bounded by a distribution-free power ceiling</span>],
            ]} />
          </div>
          <Block title={crossed ? 'Risk acceptance — revoked' : 'Risk acceptance'}>
            <DL rows={[
              ['State', crossed
                ? <Status kind="crit">revoked</Status>
                : <Status kind="warn">in force</Status>],
              ['Authority', DISP.risk_accepted_by.authority],
              ['Accepted', <span className="id">{DISP.risk_accepted_by.utc}</span>],
              ['Expiry', crossed
                ? <span className="id" style={{ color: 'var(--cr)', textDecoration: 'line-through' }}>{DISP.expires_utc}</span>
                : <span className="id">{DISP.expires_utc}</span>],
            ]} />
            <p className="section-note" style={{ marginTop: 12, marginBottom: 0 }}>{DISP.rationale}</p>
          </Block>
        </div>
      </Section>

      <Section title="Controls" meta={crossed ? 'revoked' : '3 in force'}>
        <div className="cols cols-2">
          <ol className="ol">
            {DISP.compensating_controls.map(c => <li key={c}>{c}</li>)}
          </ol>
          <Block title="Re-assessment triggers" meta={`${DISP.reassessment_triggers.length} armed`}>
            <div className="table-wrap">
              <table>
                <thead><tr><th>Trigger</th><th style={{ width: 100 }}>State</th></tr></thead>
                <tbody>
                  {DISP.reassessment_triggers.map(t => {
                    const fired = crossed && t === 'ioc_match_on_receipt_stream'
                    return (
                      <tr key={t} className={fired ? 'flagged' : ''}>
                        <td className="t-id">{t}</td>
                        <td>{fired
                          ? <Status kind="crit">fired</Status>
                          : <Status kind="quiet">armed</Status>}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <hr className="r" />
            <DL rows={[
              ['Indicator release level', <Status kind="neutral">{report.ioc.release_level} local</Status>],
              ['Promotion requires', 'named authority, recorded in the ledger'],
            ]} />
            <p className="section-note" style={{ marginTop: 12, marginBottom: 0 }}>
              The default release level discloses nothing. Widening it is an act by a named
              authority, recorded in the chain like any other.
            </p>
          </Block>
        </div>
      </Section>
    </>
  )
}
