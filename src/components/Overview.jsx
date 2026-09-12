import React from 'react'
import {
  PageHead, Section, Sub, Status, Metrics, Metric, DL, Ev, Notice, Ref, Term,
} from './ui.jsx'
import { report, classDivergence } from '../data/report.js'

const DEPTH = [
  {
    tier: 'T1', access: 'Artefact only', reached: true,
    items: [
      ['Precision-ladder fingerprint', '< 1 min'],
      ['Trigger reversal, FP32 and INT8', '25–40 min'],
      ['Parameter and activation statistics', 'seconds'],
      ['Receipt-stream monitor', 'continuous'],
    ],
  },
  {
    tier: 'T2', access: 'Training data', reached: true,
    items: [
      ['Four detectors merged per source', 'minutes'],
      ['Canary recall', 'seconds'],
      ['Partition aggregation, certificate', '2–4 h'],
      ['Drift separated from manipulation', 'minutes'],
    ],
  },
  {
    tier: 'T3', access: 'Full pipeline', reached: false,
    items: [
      ['Per-shard influence sketches', 'hours'],
      ['Causal attribution, seeds and control', '4–8 h'],
      ['Containment and amplitude sweep', '1–2 h'],
    ],
  },
]

const FINDING_LABEL = {
  trigger_reversal: 'INT8 output divergence, trigger recovered',
  source_aggregation: 'Source-level score over declared FDR',
}

export default function Overview({ go, dispositionState }) {
  const d = report.disposition
  const quarantined = dispositionState === 'QUARANTINE'
  const int8 = report.precision_ladder.fingerprint_divergence[1]
  const stopClass = classDivergence[14]

  return (
    <>
      <PageHead
        title="Assessment summary"
        subtitle="INT8 deployment assessment"
        meta={<>12 suppliers · INT8 · T2 · Issued 17 Sep 2026 · <span className="id">{report.report_id}</span></>}
      />

      <Metrics>
        <Metric
          label="Disposition"
          value={dispositionState.replace(/_/g, ' ')}
          tone={quarantined ? 'crit' : 'warn'}
          sm
          context={quarantined
            ? <>Moved by the receipt monitor · acceptance revoked</>
            : <>Expires 16 Dec 2026 · 3 controls</>}
        />
        <Metric
          label="Findings" value="2"
          context={<>F-1 corroborated · F-2 indicative</>}
        />
        <Metric
          label="Assessment depth" value="T2" sm
          context={<>Training data · A2 access</>}
        />
        <Metric
          label="Training sources" value="12"
          context={<>1 carries a reported score</>}
        />
      </Metrics>

      <Section title="Scope">
        <div className="cols cols-2">
          <DL rows={[
            ['Build assessed', <>INT8 · <span className="id">int8_ptq</span></>],
            ['Model', <span className="id">{report.artefact.logical_model_id}</span>],
            ['Family', report.artefact.family],
            ['Rungs assessed', '4 of 5, 1 declared unavailable'],
            ['Training sources', '12 contract lots'],
          ]} />
          <DL rows={[
            ['Assessment depth', 'T2 · training data'],
            ['Reference population', <>64 clean models · <span className="id">resnet18/gtsrb</span></>],
            ['Test battery', <>Generation 7 · 200 probes</>],
            ['Authority', d.risk_accepted_by.authority],
            ['Signature', <><Status kind="ok">Ed25519</Status> <Ref value={report.signature.key_id}>{report.signature.key_id}</Ref></>],
          ]} />
        </div>
      </Section>

      <Section
        title="Key finding"
        meta="F-1"
        actions={<button className="text" onClick={() => go('ladder')}>Open precision ladder</button>}
      >
        <div className="cols cols-2">
          <div>
            <Notice kind="warn">
              <b>INT8 divergence detected.</b> Every check at FP32 returned no finding. The build
              that will deploy diverges from it on 11 of 200 probes, concentrated on one output
              class.
            </Notice>
            <Ev label="INT8 probe divergence" value={`${int8.probes_diverging} / ${int8.probes_total}`} tone="warn" lg />
            <Ev label="Class 14 (STOP)" value={`${stopClass.probesDiverging} / ${int8.probes_diverging}`} tone="warn" lg
              note="Remaining 3 on class 17 (no entry)" />
            <Ev label="FP32 accuracy" value="96.8%" lg />
          </div>
          <div>
            <Sub title="FP32 baseline">
              <Ev label="Fingerprint" value="Within reference band" tone="ok" />
              <Ev label="Trigger reversal" value="No outlier" tone="ok"
                note="p_pooled = 0.44 against critical value 0.00116" />
              <Ev label="Battery result" value="No finding" tone="ok" />
            </Sub>
            <Sub title="INT8 deployment build">
              <Ev label="Detection p" value="≤ 0.01538" tone="warn"
                note={<>At the <Term id="pfloor">floor</Term> for 64 reference models</>} />
              <Ev label="Divergence concentration" value="0.91" tone="warn"
                note="Operating point ≥ 0.70 over ≤ 3 classes" />
              <Ev label="Reversal, class 14" value="0.00073" tone="warn"
                note="Below critical value 0.00116 → reported" />
            </Sub>
          </div>
        </div>
      </Section>

      <Section title="Findings" meta="2 recorded">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th style={{ width: 60 }}>ID</th>
                <th style={{ width: 130 }}>Status</th>
                <th>Description</th>
                <th style={{ width: 150 }}>Asset</th>
                <th style={{ width: 130 }}>Attribution</th>
                <th style={{ width: 80 }}></th>
              </tr>
            </thead>
            <tbody>
              {report.findings.map(f => (
                <tr key={f.finding_id} className="flagged">
                  <td className="t-id">{f.finding_id}</td>
                  <td>
                    <Status kind={f.evidence_strength === 'corroborated' ? 'warn' : 'neutral'}>
                      {f.evidence_strength}
                    </Status>
                  </td>
                  <td className="t-wrap">{FINDING_LABEL[f.mechanism]}</td>
                  <td className="t-id">{f.rung ? `${f.rung} · cls ${f.class}` : f.contributor}</td>
                  <td>
                    <span className="id">{f.attribution_set.join(', ')}</span>
                    <div className="hint">set-valued</div>
                  </td>
                  <td>
                    <button className="text" onClick={() => go(f.finding_id === 'F-1' ? 'reversal' : 'contributors')}>
                      Evidence
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="section-note" style={{ marginTop: 10, marginBottom: 0 }}>
          Each finding carries a reason code, evidence items with per-item digests,
          <Term id="strength"> evidence strength</Term> beside the statistic that produced it, the
          affected asset and a disposition. A finding missing any of the five is rejected before
          the report is signed.
        </p>
      </Section>

      <Section title="Artefacts" meta="4 builds">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Build</th>
                <th style={{ width: 110 }}>Format</th>
                <th style={{ width: 130 }}>Signer</th>
                <th style={{ width: 170 }}>Role</th>
                <th style={{ width: 120 }}>Status</th>
                <th style={{ width: 200 }}>Digest</th>
              </tr>
            </thead>
            <tbody>
              {report.artefact.builds.map(b => (
                <tr key={b.rung} className={b.role === 'will_run' ? 'flagged' : ''}>
                  <td className="t-id">{b.rung}</td>
                  <td>{b.format}</td>
                  <td className="t-id">{b.signer}</td>
                  <td>{b.role.replace(/_/g, ' ')}</td>
                  <td>
                    {b.certified
                      ? <Status kind="ok">certified</Status>
                      : <Status kind="quiet">recorded</Status>}
                  </td>
                  <td><Ref value={b.digest}>{b.digest}</Ref></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <DL left rows={[
          ['Preprocessing chain', <Ref value={report.artefact.preprocessing_chain_digest}>{report.artefact.preprocessing_chain_digest}</Ref>],
          ['Quantiser', <span className="id">{report.artefact.conversion.quantiser}</span>],
          ['Calibration set', <Ref value={report.artefact.conversion.calibration_set_digest}>{report.artefact.conversion.calibration_set_digest}</Ref>],
        ]} />
      </Section>

      <Section
        title="Assessment depth"
        meta="T2 reached"
        note="Access to a supplier's training data is not always available. Each depth is a complete assessment; the ones above it are additions."
      >
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th style={{ width: 60 }}>Depth</th>
                <th style={{ width: 150 }}>Access required</th>
                <th>Components</th>
                <th style={{ width: 110 }} className="t-num">Cost</th>
                <th style={{ width: 110 }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {DEPTH.map(t => t.items.map(([what, cost], i) => (
                <tr key={t.tier + what} className={t.reached ? '' : 'muted'}>
                  {i === 0 && <td className="t-id" rowSpan={t.items.length}>{t.tier}</td>}
                  {i === 0 && <td rowSpan={t.items.length}>{t.access}</td>}
                  <td className="t-wrap">{what}</td>
                  <td className="t-num">{cost}</td>
                  {i === 0 && (
                    <td rowSpan={t.items.length}>
                      {t.reached
                        ? <Status kind="ok">reached</Status>
                        : <Status kind="quiet">not reached</Status>}
                    </td>
                  )}
                </tr>
              )))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section
        title="Controls"
        meta={quarantined ? 'revoked' : '3 in force'}
        actions={<button className="text" onClick={() => go('disposition')}>Open disposition</button>}
      >
        <div className="cols cols-2-1">
          <div>
            <ol className="ol">
              {d.compensating_controls.map(c => <li key={c}>{c}</li>)}
            </ol>
          </div>
          <DL rows={[
            ['State', quarantined
              ? <Status kind="crit">revoked</Status>
              : <Status kind="warn">in force</Status>],
            ['Authority', d.risk_accepted_by.authority],
            ['Accepted', <span className="id">{d.risk_accepted_by.utc}</span>],
            ['Expiry', quarantined
              ? <span className="id" style={{ color: 'var(--crit)', textDecoration: 'line-through' }}>{d.expires_utc}</span>
              : <span className="id">{d.expires_utc}</span>],
          ]} />
        </div>
        <p className="section-note" style={{ marginTop: 12, marginBottom: 0 }}>{d.rationale}</p>
      </Section>

      <Section title="Limitations" meta="verdict form">
        <div className="cols cols-2">
          <div>
            <div className="verdict">{report.verdict_statement.text}</div>
            <p className="section-note" style={{ margin: '12px 0 6px' }}>
              Blocked phrasings — an array in the report, enforced at build:
            </p>
            <div className="st-row">
              {report.verdict_statement.forbidden_alternatives.map(f => (
                <Status kind="crit" strike key={f}>{f}</Status>
              ))}
            </div>
          </div>
          <div>
            <Ev label="Attack classes in taxonomy" value="17" />
            <Ev label="Assessed" value="9 + 1 partial" tone="ok" />
            <Ev label="Declared unsupported" value="4" />
            <Ev label="Out of scope" value="3" />
            <Notice>
              No behavioural test can establish that a model is clean —{' '}
              <a href="https://arxiv.org/abs/2204.06974" target="_blank" rel="noreferrer">a proved
              result</a>, not a shortfall in the instrument.{' '}
              <button className="text" onClick={() => go('coverage')}>Full coverage</button>
            </Notice>
          </div>
        </div>
      </Section>
    </>
  )
}
