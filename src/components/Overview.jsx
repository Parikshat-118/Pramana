import React from 'react'
import {
  PageHead, Section, Block, Status, Metrics, Metric, DL, Ev, Callout, Ref, Term,
  Finding, Figures, Figure, Probes, DivergenceChart, Legend,
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
        meta={<>12 suppliers · INT8 · T2 · Issued 12 Sep 2026 · <span className="id">{report.report_id}</span></>}
      />

      <Metrics>
        <Metric
          label="Disposition"
          value={dispositionState.replace(/_/g, ' ')}
          tone={quarantined ? 'crit' : 'warn'}
          sm
          context={quarantined
            ? <>Moved by the receipt monitor · acceptance revoked</>
            : <>Expires 11 Dec 2026 · 3 controls</>}
        />
        <Metric label="Findings" value="2" context={<>F-1 corroborated · F-2 indicative</>} />
        <Metric label="Assessment depth" value="T2" sm context={<>Training data · A2 access</>} />
        <Metric label="Training sources" value="12" context={<>1 carries a reported score</>} />
      </Metrics>

      <Finding
        severity="warn"
        id="F-1"
        title="INT8 output divergence"
        asset="int8_ptq · class 14"
      >
        <Figures>
          <Figure
            value={int8.probes_diverging} denom={int8.probes_total} tone="warn"
            label="Probes divergent"
            sub={<>FP32 → FP16 divergence: 0 / 200</>}
          />
          <Figure
            value={stopClass.probesDiverging} denom={int8.probes_diverging} tone="warn"
            label="On class 14 (STOP)"
            sub={<>Remaining 3 on class 17 (no entry)</>}
          />
          <Figure
            value="0.91" tone="warn"
            label="Divergence concentration"
            sub={<>Operating point ≥ 0.70 over ≤ 3 classes</>}
          />
          <Figure
            value="96.8%" sm
            label="FP32 accuracy"
            sub={<>Fingerprint within reference band</>}
          />
          <Figure
            value="≤ 0.01538" sm tone="warn"
            label="Detection p"
            sub={<>At the <Term id="pfloor">floor</Term> for 64 reference models</>}
          />
        </Figures>

        <hr className="r" />

        <div className="cols cols-2">
          <Block title="Probe bank" meta="200 probes · sealed before receipt">
            <Probes diverging={int8.probes_diverging} strip />
            <div style={{ marginTop: 10 }}>
              <Legend items={[
                ['var(--wn-solid)', 'diverges between FP32 and INT8'],
                ['var(--sunken)', 'agrees'],
              ]} />
            </div>
          </Block>
          <Block title="Divergence across output classes" meta="2 of 43 affected">
            <DivergenceChart data={classDivergence} sm />
            <div style={{ marginTop: 10 }}>
              <Legend items={[
                ['var(--wn-solid)', 'class 14 — STOP'],
                ['#eeba6a', 'class 17 — no entry'],
                ['var(--border-2)', 'within normal variation'],
              ]} />
            </div>
          </Block>
        </div>

        <hr className="r" />

        <div className="cols cols-2">
          <Block title="FP32 baseline" meta="no finding">
            <Ev label="Fingerprint" value="Within reference band" tone="ok" />
            <Ev label="Trigger reversal" value="No outlier" tone="ok"
              note="p_pooled = 0.44 against critical value 0.00116" />
            <Ev label="Battery result" value="No finding" tone="ok" />
          </Block>
          <Block title="INT8 deployment build" meta="reported">
            <Ev label="Reversal, class 14" value="0.00073" tone="warn"
              note="Below critical value 0.00116 → reported" />
            <Ev label="Attack success rate" value="93.0%" tone="warn"
              note="Confirmed on the delivered INT8 binary" />
            <Ev label="Evidence strength" value="Corroborated" tone="warn"
              note="Precision-ladder divergence · activation statistics" />
          </Block>
        </div>

        <div className="st-row" style={{ marginTop: 16 }}>
          <button className="text" onClick={() => go('ladder')}>Precision ladder →</button>
          <span className="mute">·</span>
          <button className="text" onClick={() => go('reversal')}>Reversal evidence →</button>
        </div>
      </Finding>

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
            ['Test battery', 'Generation 7 · 200 probes'],
            ['Authority', d.risk_accepted_by.authority],
            ['Signature', <><Status kind="ok">Ed25519</Status> <Ref value={report.signature.key_id}>{report.signature.key_id}</Ref></>],
          ]} />
        </div>
      </Section>

      <Section title="Findings" meta="2 recorded" flush>
        <table>
          <thead>
            <tr>
              <th style={{ width: 64 }}>ID</th>
              <th style={{ width: 132 }}>Status</th>
              <th>Description</th>
              <th style={{ width: 156 }}>Asset</th>
              <th style={{ width: 132 }}>Attribution</th>
              <th style={{ width: 92 }} />
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
                <td className="t-wrap t-key">{FINDING_LABEL[f.mechanism]}</td>
                <td className="t-id">{f.rung ? `${f.rung} · cls ${f.class}` : f.contributor}</td>
                <td>
                  <span className="id">{f.attribution_set.join(', ')}</span>
                  <div className="hint">set-valued</div>
                </td>
                <td>
                  <button className="text" onClick={() => go(f.finding_id === 'F-1' ? 'reversal' : 'contributors')}>
                    Evidence →
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      <Section title="Artefacts" meta="4 builds">
        <div className="table-wrap scroll-x">
          <table>
            <thead>
              <tr>
                <th>Build</th>
                <th style={{ width: 110 }}>Format</th>
                <th style={{ width: 128 }}>Signer</th>
                <th style={{ width: 172 }}>Role</th>
                <th style={{ width: 118 }}>Status</th>
                <th style={{ width: 204 }}>Digest</th>
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
        <hr className="r" />
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
        <div className="table-wrap scroll-x">
          <table>
            <thead>
              <tr>
                <th style={{ width: 64 }}>Depth</th>
                <th style={{ width: 150 }}>Access required</th>
                <th>Components</th>
                <th style={{ width: 110 }} className="t-num">Cost</th>
                <th style={{ width: 112 }}>Status</th>
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
        actions={<button className="text" onClick={() => go('disposition')}>Disposition →</button>}
      >
        <div className="cols cols-2-1">
          <ol className="ol">
            {d.compensating_controls.map(c => <li key={c}>{c}</li>)}
          </ol>
          <DL rows={[
            ['State', quarantined
              ? <Status kind="crit">revoked</Status>
              : <Status kind="warn">in force</Status>],
            ['Authority', d.risk_accepted_by.authority],
            ['Accepted', <span className="id">{d.risk_accepted_by.utc}</span>],
            ['Expiry', quarantined
              ? <span className="id" style={{ color: 'var(--cr)', textDecoration: 'line-through' }}>{d.expires_utc}</span>
              : <span className="id">{d.expires_utc}</span>],
          ]} />
        </div>
        <Callout label="Rationale on record">{d.rationale}</Callout>
      </Section>

      <Section title="Limitations" meta="verdict form">
        <div className="cols cols-2">
          <div>
            <div className="verdict">{report.verdict_statement.text}</div>
            <div className="block-head" style={{ marginTop: 18 }}>
              <span>Blocked phrasings</span>
              <span className="section-meta">enforced at build</span>
            </div>
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
            <Callout label="Why no pass verdict exists">
              No behavioural test can establish that a model is clean.{' '}
              <a href="https://arxiv.org/abs/2204.06974" target="_blank" rel="noreferrer">Proved
              result</a>, not a shortfall in the instrument.{' '}
              <button className="text" onClick={() => go('coverage')}>Full coverage →</button>
            </Callout>
          </div>
        </div>
      </Section>
    </>
  )
}
