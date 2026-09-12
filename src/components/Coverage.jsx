import React, { useState } from 'react'
import {
  PageHead, Section, Sub, Status, Metrics, Metric, DL, Ev, Notice, Term,
} from './ui.jsx'
import { report } from '../data/report.js'

const C = report.coverage
const D = report.drift_assessment

const TONE = {
  assessed: 'ok',
  partial: 'warn',
  declared_unsupported: 'neutral',
  out_of_scope: 'quiet',
  measured: 'ok',
  modelled_proxy: 'warn',
}

const FILTERS = [
  { id: 'all', label: 'All', test: () => true },
  { id: 'covered', label: 'Covered', test: c => c.status === 'assessed' || c.status === 'partial' },
  { id: 'not', label: 'Not covered', test: c => c.status === 'declared_unsupported' || c.status === 'out_of_scope' },
]

export default function Coverage() {
  const [filter, setFilter] = useState('all')
  const active = FILTERS.find(f => f.id === filter)
  const rows = C.classes.filter(active.test)
  const sum = C.assessed + C.partial + C.declared_unsupported + C.out_of_scope + C.not_assessed

  return (
    <>
      <PageHead
        title="Coverage & limits"
        subtitle="Coverage against the committed attack taxonomy"
        meta={<>Generated at build time from <span className="id">{C.generated_from}</span></>}
      />

      <Metrics>
        <Metric
          label="Attack classes" value={String(C.classes_total)}
          context={<>Sum check <b>{sum}</b> = {C.classes_total} — a class missing from the taxonomy fails the build</>}
        />
        <Metric
          label="Assessed" value={`${C.assessed} + ${C.partial}`} tone="ok"
          context={<>{C.partial} partial · the denominator is <b>{C.classes_total}</b>, not {C.assessed}</>}
        />
        <Metric
          label="Declared unsupported" value={String(C.declared_unsupported)}
          context={<>Each carries a <span className="id">reason</span> field</>}
        />
        <Metric
          label="Out of scope" value={String(C.out_of_scope)}
          context={<>Not addressable by behavioural assessment</>}
        />
      </Metrics>

      <Section
        title="Coverage"
        meta={`${rows.length} of ${C.classes_total}`}
        actions={
          <div className="btn-group">
            {FILTERS.map(f => (
              <button key={f.id} className={filter === f.id ? 'on' : ''} onClick={() => setFilter(f.id)}>
                {f.label}
              </button>
            ))}
          </div>
        }
      >
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th style={{ width: 300 }}>Attack class</th>
                <th style={{ width: 180 }}>Status</th>
                <th>Reason or note</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(c => (
                <tr key={c.class} className={TONE[c.status] === 'quiet' ? 'muted' : ''}>
                  <td className="t-id">{c.class}</td>
                  <td><Status kind={TONE[c.status]}>{c.status.replace(/_/g, ' ')}</Status></td>
                  <td className="t-wrap">{c.reason || c.note || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="section-note" style={{ marginTop: 10, marginBottom: 0 }}>
          The <Term id="taxonomy">taxonomy</Term> is hashed before assessment begins and this table
          is enumerated from it, so a class cannot be dropped from the denominator. A refusal is a
          value, not a blank.
        </p>
      </Section>

      <Section title="Verdict form" meta={<span className="id">{report.verdict_statement.form}</span>}>
        <div className="cols cols-2">
          <div>
            <div className="verdict">{report.verdict_statement.text}</div>
            <p className="section-note" style={{ margin: '12px 0 6px' }}>
              Blocked phrasings — an array in the report, enforced at build rather than discouraged
              in a style guide:
            </p>
            <div className="st-row">
              {report.verdict_statement.forbidden_alternatives.map(f => (
                <Status kind="crit" strike key={f}>{f}</Status>
              ))}
            </div>
            <Notice>
              Goldwasser, Kim, Vaikuntanathan and Zamir{' '}
              <a href="https://arxiv.org/abs/2204.06974" target="_blank" rel="noreferrer">construct
              backdoors</a> that no efficient black-box test can detect, so no battery, reference
              population or quantity of sampling can rule one out. A pass verdict would assert
              something provably unestablishable; absence of evidence is the strongest true
              statement available, and the only form this system emits.
            </Notice>
          </div>
          <Sub title="Rungs with no finding" meta={`${report.verdict_statement.rungs_with_no_finding.length} rungs`}>
            <div className="table-wrap">
              <table>
                <thead><tr><th>Rung</th><th style={{ width: 130 }}>Result</th></tr></thead>
                <tbody>
                  {report.verdict_statement.rungs_with_no_finding.map(r => (
                    <tr key={r}>
                      <td className="t-id">{r}</td>
                      <td><Status kind="ok">no finding</Status></td>
                    </tr>
                  ))}
                  <tr className="flagged">
                    <td className="t-id">int8_ptq</td>
                    <td><Status kind="warn">finding</Status></td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="section-note" style={{ marginTop: 12, marginBottom: 0 }}>
              The statement is scoped to the rungs where nothing fired and names them, rather than
              covering the artefact as a whole.
            </p>
          </Sub>
        </div>
      </Section>

      <Section
        title="Distribution-shift axes"
        meta={`${D.axes_total} axes`}
        note="A street-sign corpus contains neither terrain nor season variation, so two axes are declared unsupported rather than claimed. A corruption model is a hypothesis about an axis, not a sample of it, and is recorded as a proxy."
      >
        <div className="cols cols-2">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th style={{ width: 140 }}>Axis</th>
                  <th style={{ width: 170 }}>Status</th>
                  <th>Shift or reason</th>
                </tr>
              </thead>
              <tbody>
                {D.axes.map(a => (
                  <tr key={a.axis} className={a.status === 'declared_unsupported' ? 'muted' : ''}>
                    <td className="t-id">{a.axis}</td>
                    <td><Status kind={TONE[a.status] || 'neutral'}>{a.status.replace(/_/g, ' ')}</Status></td>
                    <td className="t-wrap">
                      {a.shift_magnitude_over_null_iqr != null
                        ? <>{a.shift_magnitude_over_null_iqr} over reference IQR</>
                        : (a.realism || a.reason)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Sub title="Self-limiting fields" meta="3 recorded">
            <Ev label="family_delta_exceeds_ceiling" value="true" tone="warn"
              note="Measured 0.88 against a ceiling of 0.50 fixed in advance — reuse on another model family is refused" />
            <Ev label="detection_p_is_floor" value="true" tone="warn"
              note="64 reference models cannot resolve finer than 1/65, so the bound is printed" />
            <Ev label="attribution_mode" value="set_valued" tone="warn"
              note="Causal verification unavailable at this depth, so no supplier is named" />
            <p className="section-note" style={{ marginTop: 12, marginBottom: 0 }}>
              Each of these narrows what may be done with the result next, in a document that would
              otherwise be free not to mention it.
            </p>
          </Sub>
        </div>
        <DL left rows={[
          ['Sum check', <><span className="id">{D.sum_check.expression}</span> = {D.sum_check.value} = {D.axes_total}</>],
        ]} />
      </Section>
    </>
  )
}
