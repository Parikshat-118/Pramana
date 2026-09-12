import React, { useState, useEffect, useRef } from 'react'
import {
  PageHead, Section, Block, Status, Metrics, Metric, DL, Ev, Bar, Callout, Toolbar, Ref, Term,
  Legend, Probes, DivergenceChart,
} from './ui.jsx'
import { report, classDivergence, classDivergenceFp32 } from '../data/report.js'

const L = report.precision_ladder
const NC = report.null_calibration

const RUNGS = [
  { id: 'fp32', pair: null, role: 'Delivered file' },
  { id: 'fp16', pair: 'fp32→fp16', role: 'Reproduced' },
  { id: 'int8_ptq', pair: 'fp32→int8_ptq', role: 'Deployment build' },
  { id: 'int8_vendor_claimed', pair: 'int8_ptq→int8_vendor_claimed', role: 'Delivered, not deployed' },
]

export default function Ladder() {
  const [step, setStep] = useState(4)      // 0 = none assessed, 4 = all rungs assessed
  const [running, setRunning] = useState(false)
  const timer = useRef(null)

  useEffect(() => () => clearInterval(timer.current), [])

  const run = () => {
    clearInterval(timer.current)
    setRunning(true)
    setStep(0)
    let i = 0
    timer.current = setInterval(() => {
      i += 1
      setStep(i)
      if (i >= 4) { clearInterval(timer.current); setRunning(false) }
    }, 750)
  }

  const stop = next => { clearInterval(timer.current); setRunning(false); setStep(next) }

  const live = step >= 3
  const int8 = L.fingerprint_divergence[1]
  const stopCls = classDivergence[14]

  return (
    <>
      <PageHead
        title="Precision ladder"
        subtitle="Precision-differential assessment"
        meta="4 rungs assessed · 1 declared unavailable · 200 probes per rung · battery generation 7"
      />

      <Toolbar hint={running
        ? 'Assessing rungs in order'
        : live ? 'All rungs assessed' : 'FP32 only — the delivered file'}>
        <button className="primary" onClick={run} disabled={running}>Run assessment</button>
        <div className="toolbar-sep" />
        <div className="btn-group">
          <button className={step === 1 && !running ? 'on' : ''} onClick={() => stop(1)} disabled={running}>FP32 only</button>
          <button className={step === 4 && !running ? 'on' : ''} onClick={() => stop(4)} disabled={running}>All rungs</button>
        </div>
      </Toolbar>

      <Metrics>
        <Metric
          label="Detection p, int8_ptq"
          value={live ? '≤ 0.01538' : '—'}
          tone={live ? 'warn' : undefined}
          sm
          context={<>Floor <b>0.01538</b> · <span className="id">detection_p_is_floor: true</span></>}
        />
        <Metric
          label="Probe divergence"
          value={live ? `${int8.probes_diverging} / 200` : '0 / 200'}
          tone={live ? 'warn' : 'ok'}
          context={<>Against <span className="id">fp32→fp16</span>: <b>0 / 200</b></>}
        />
        <Metric
          label="Concentration"
          value={live ? '0.91' : '0.09'}
          tone={live ? 'warn' : 'ok'}
          context={<>Operating point <b>≥ 0.70 over ≤ 3 classes</b> · FPR <b>1.6%</b></>}
        />
        <Metric
          label="Classes affected"
          value={live ? '2 / 43' : '0 / 43'}
          tone={live ? 'warn' : 'ok'}
          context={live
            ? <>Dominant class <b>14 (STOP)</b>, {stopCls.probesDiverging} of {int8.probes_diverging} probes</>
            : <>Flat profile across all classes</>}
        />
      </Metrics>

      {step >= 1 && step < 3 && (
        <Callout kind="ok" label="FP32 assessed — no finding">
          Accuracy 96.8%, fingerprint within the reference band, no reversal outlier. A pipeline
          that verifies hashes and signatures on the delivered file stops here.
        </Callout>
      )}
      {live && (
        <Callout kind="warn" label="Detection fires at int8_ptq">
          11 of 200 probes diverge, {stopCls.probesDiverging} on class 14 (STOP) and 3 on class 17.
          Concentration 0.91 against an operating point of 0.70.
        </Callout>
      )}

      <Section title="Rungs" meta={`${L.rungs_assessed.length} assessed`} flush>
        <div className="scroll-x">
          <table>
            <thead>
              <tr>
                <th style={{ width: 172 }}>Rung</th>
                <th style={{ width: 176 }}>Role</th>
                <th style={{ width: 182 }}>Comparison</th>
                <th>Probe divergence</th>
                <th style={{ width: 92 }} className="t-num">Probes</th>
                <th style={{ width: 96 }} className="t-num">p</th>
                <th style={{ width: 152 }}>Result</th>
              </tr>
            </thead>
            <tbody>
              {RUNGS.map((r, i) => {
                const d = r.pair ? L.fingerprint_divergence.find(x => x.pair === r.pair) : null
                const active = step >= i + 1
                const fires = active && d?.detection_fires
                return (
                  <tr key={r.id} className={fires ? 'flagged' : active ? '' : 'muted'}>
                    <td className="t-id">{r.id}</td>
                    <td>{r.role}</td>
                    <td className="t-id">{d ? d.pair : '—'}</td>
                    <td>
                      {d
                        ? <Bar value={active ? d.probes_diverging : 0} max={20}
                            tone={fires ? 'warn' : 'neutral'} />
                        : <span className="mute">baseline for every comparison</span>}
                    </td>
                    <td className="t-num">{active && d ? `${d.probes_diverging}/${d.probes_total}` : '—'}</td>
                    <td className="t-num">
                      {active && d ? (d.detection_p_is_floor ? '≤0.01538' : d.detection_p) : '—'}
                    </td>
                    <td>
                      {!active ? <Status kind="quiet">queued</Status>
                        : fires ? <Status kind="warn">detection fires</Status>
                        : d ? <Status kind="ok">no finding</Status>
                        : <Status kind="neutral">baseline</Status>}
                    </td>
                  </tr>
                )
              })}
              <tr className="muted">
                <td className="t-id" style={{ textDecoration: 'line-through' }}>pruned</td>
                <td>Not produced by vendor</td>
                <td>—</td>
                <td className="t-wrap">Declared unavailable rather than skipped, so it stays in the denominator</td>
                <td className="t-num">—</td>
                <td className="t-num">—</td>
                <td><Status kind="quiet">unavailable</Status></td>
              </tr>
            </tbody>
          </table>
        </div>
      </Section>

      <Section
        title="Divergence across output classes"
        meta={live ? 'concentrated' : 'flat'}
        note={live
          ? 'Concentration is the test, not disagreement. A determined search can manufacture disagreement between precisions in a clean model, so differing rungs prove nothing alone. The condition is that the difference collapses onto a handful of classes.'
          : 'At FP32 the same measurement returns a flat profile across all 43 classes.'}
      >
        <div className="cols cols-2-1">
          <div>
            <DivergenceChart data={live ? classDivergence : classDivergenceFp32} axis />
            <div style={{ marginTop: 14 }}>
              <Legend items={[
                ['var(--wn-solid)', 'dominant class'],
                ['#eeba6a', 'secondary'],
                ['var(--border-2)', 'within normal variation'],
              ]} />
            </div>
          </div>
          <Block title="Probe bank" meta="sealed before receipt">
            <Probes diverging={live ? 11 : 0} />
            <div style={{ margin: '12px 0 16px' }}>
              <Legend items={[['var(--wn-solid)', 'diverges'], ['var(--sunken)', 'agrees']]} />
            </div>
            <DL rows={[
              ['Battery A', <Ref value={report.battery.battery_a_digest}>{report.battery.battery_a_digest}</Ref>],
              ['Battery B', <Status kind="neutral">unopened</Status>],
              ['Committed', <span className="id">{report.battery.committed_at_utc}</span>],
              ['Before receipt', <Status kind="ok">true</Status>],
              ['Probes traverse', 'deployed preprocessing chain'],
            ]} />
          </Block>
        </div>
      </Section>

      <Section title="Reference population" meta="n = 64">
        <div className="cols cols-2">
          <div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>Arm</th><th style={{ width: 60 }} className="t-num">n</th><th style={{ width: 200 }}>Role</th></tr>
                </thead>
                <tbody>
                  {NC.arms.map(a => (
                    <tr key={a.arm} className={a.role === 'operational_null' ? 'selected' : ''}>
                      <td className="t-id">{a.arm}</td>
                      <td className="t-num">{a.n}</td>
                      <td>{a.role.replace(/_/g, ' ')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Callout label="Reuse refused">
              Transfer to another model family measured at 0.88 against a ceiling of 0.50 fixed in
              advance. Reuse of this reference population on another family returns{' '}
              <span className="id">assessment_unavailable: no_fitted_null</span> rather than a
              number.
            </Callout>
          </div>
          <div>
            <Block title="p-value floors">
              <Ev label={<><Term id="pfloor">Detection floor</Term>, one test</>} value="0.01538" note="1/(64+1) at α = 0.05" />
              <Ev label="Localisation floor, pooled" value="0.00036" note="1/(64×43+1)" />
              <Ev label="Smallest BH critical value" value="0.00116" note="α/43 — the floor sits 3.2× below it" />
            </Block>
            <Block title="Transfer ceiling">
              <Ev label="Corpus delta" value="0.31" tone="ok" note="Against ceiling 0.50" />
              <Ev label="Family delta" value="0.88" tone="warn" note="Exceeds ceiling — reuse refused" />
              <Ev label="Affects this report" value="No" tone="ok" note="Artefact matches the fitted family and corpus exactly" />
            </Block>
          </div>
        </div>
      </Section>

      <Section
        title="Converter provenance"
        meta="consistent"
        note="Quantisation has two inputs, the weights and a calibration set, and only the first is normally written into a contract. Both INT8 builds are therefore compared against each other."
      >
        <div className="cols cols-2">
          <DL rows={[
            ['Certified rung', <span className="id">int8_ptq</span>],
            ['Quantiser', <span className="id">{report.artefact.conversion.quantiser}</span>],
            ['Calibration set', <Ref value={report.artefact.conversion.calibration_set_digest}>{report.artefact.conversion.calibration_set_digest}</Ref>],
            ['Scale table', <Ref value={report.artefact.conversion.scale_table_digest}>{report.artefact.conversion.scale_table_digest}</Ref>],
            ['Shared scale table', <Status kind="ok">true</Status>],
            ['Recorded, not certified', <span className="id">int8_vendor_claimed</span>],
          ]} />
          <div>
            <Ev label="Divergence, int8_ptq → int8_vendor" value="3 / 200" note="p = 0.28 against floor 0.01538" />
            <Ev label="Result" value="No finding" tone="ok" />
            <Callout label="Separate finding class">
              Both INT8 builds were produced from the same scale table, so a difference between them
              would indicate an undisclosed conversion step rather than quantisation noise —{' '}
              <span className="id">converter_provenance_mismatch</span>. It did not fire.
            </Callout>
          </div>
        </div>
      </Section>
    </>
  )
}
