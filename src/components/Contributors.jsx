import React, { useState, useMemo } from 'react'
import {
  PageHead, Section, Sub, Status, Metrics, Metric, DL, Ev, Bar, Notice, Toolbar, Term, pct,
} from './ui.jsx'
import { report, lots } from '../data/report.js'

/**
 * e-BH step-up. Sort e-values descending, find the largest k for which e_(k) >= m/(alpha*k),
 * and report the top k. Computed here rather than stored, so moving the slider moves the
 * threshold and the reported set for real.
 */
function eBH(values, alpha) {
  const m = values.length
  const sorted = [...values].sort((a, b) => b.eValue - a.eValue)
  let k = 0
  for (let i = 1; i <= m; i++) {
    if (sorted[i - 1].eValue >= m / (alpha * i)) k = i
  }
  // The step-up threshold at the achieved k separates the reported set cleanly.
  return {
    k,
    reported: new Set(sorted.slice(0, k).map(s => s.lot)),
    threshold: m / (alpha * Math.max(k, 1)),
  }
}

const DETECTORS = [
  ['Trigger injection', 'Per-sample score against the family reference'],
  ['Label flipping', 'Label consistency measured across sources'],
  ['Near-duplicate flooding', 'Perceptual-hash clustering, normalised for lot size'],
  ['Out-of-distribution insertion', 'Mahalanobis distance on a frozen backbone'],
]

const D = report.drift_assessment.drift_vs_manipulation

export default function Contributors() {
  const [alpha, setAlpha] = useState(0.05)
  const { k, reported, threshold } = useMemo(() => eBH(lots, alpha), [alpha])
  const maxE = Math.max(...lots.map(l => l.eValue))
  const lot04 = lots.find(l => l.lot === 'lot-04')
  const lot04Reported = reported.has(lot04.lot)

  return (
    <>
      <PageHead
        title="Contributors"
        subtitle="Source aggregation under a declared false-discovery rate"
        meta="12 contract lots · 4 detectors · merged by weighted arithmetic mean · e-BH step-up"
      />

      <Toolbar hint="A source is reported only when its score clears m / (α × k).">
        <div className="slider">
          <label htmlFor="alpha">FDR α</label>
          <input id="alpha" type="range" min="0.01" max="0.25" step="0.01" value={alpha}
            onChange={e => setAlpha(parseFloat(e.target.value))} />
          <span className="slider-val">{alpha.toFixed(2)}</span>
        </div>
        <div className="toolbar-sep" />
        <div className="btn-group">
          <button className={alpha === 0.05 ? 'on' : ''} onClick={() => setAlpha(0.05)}>0.05</button>
          <button className={alpha === 0.15 ? 'on' : ''} onClick={() => setAlpha(0.15)}>0.15</button>
        </div>
      </Toolbar>

      <Metrics>
        <Metric
          label="Sources reported" value={`${k} / ${lots.length}`}
          tone={k > 0 ? 'warn' : 'ok'}
          context={<>At declared FDR <b>{alpha.toFixed(2)}</b>, set before the scores were computed</>}
        />
        <Metric
          label="Reporting threshold" value={threshold.toFixed(0)}
          context={<>m / (α × k) = <b>{lots.length}</b> / ({alpha.toFixed(2)} × {Math.max(k, 1)})</>}
        />
        <Metric
          label="Highest score" value={maxE.toFixed(0)} tone="warn"
          context={<><span className="id">lot-07</span> · 6% of corpus volume</>}
        />
        <Metric
          label="Merging rule" value="Arithmetic mean" sm tone="ok"
          context={<>Never the product — invalid under unknown dependence</>}
        />
      </Metrics>

      <Section title="Scores by source" meta={`α = ${alpha.toFixed(2)}`}>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th style={{ width: 90 }}>Lot</th>
                <th style={{ width: 110 }}>Source</th>
                <th style={{ width: 110 }} className="t-num">Volume</th>
                <th>Merged score</th>
                <th style={{ width: 90 }} className="t-num"><Term id="evalue">e-value</Term></th>
                <th style={{ width: 100 }} className="t-num">Threshold</th>
                <th style={{ width: 160 }}>Outcome</th>
              </tr>
            </thead>
            <tbody>
              {lots.map(l => {
                const rep = reported.has(l.lot)
                return (
                  <tr key={l.lot} className={rep ? 'flagged' : ''}>
                    <td className="t-id">{l.lot}</td>
                    <td className="t-id">{l.vendor}</td>
                    <td className="t-num">{pct(l.share, 0)}</td>
                    <td>
                      <Bar
                        value={Math.log10(l.eValue + 1)}
                        max={Math.log10(maxE + 1)}
                        tone={rep ? 'warn' : 'neutral'}
                      />
                    </td>
                    <td className="t-num" style={{ color: rep ? 'var(--warn)' : undefined, fontWeight: rep ? 600 : 400 }}>
                      {l.eValue.toFixed(1)}
                    </td>
                    <td className="t-num mute">{threshold.toFixed(0)}</td>
                    <td>
                      {rep
                        ? <Status kind="warn">reported · indicative</Status>
                        : <Status kind="quiet">not reported</Status>}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="Attribution" meta="finding F-2">
        <div className="cols cols-2">
          <div>
            {lot04Reported ? (
              <Notice>
                <b>At α = {alpha.toFixed(2)}, lot-04 is reported.</b> Its score of {lot04.eValue} did
                not change; the threshold moved to {threshold.toFixed(0)} because a higher share of
                false reports was accepted. The error rate that bought the change is printed beside
                the result.
              </Notice>
            ) : (
              <Notice>
                <b>lot-04 holds the second-highest score and is not reported.</b> At α ={' '}
                {alpha.toFixed(2)} it scores {lot04.eValue} against a threshold of{' '}
                {threshold.toFixed(0)}. Elevated is not a finding.
              </Notice>
            )}
            <Notice kind="warn">
              <b>What is reported is reported as indicative.</b> source-07 cleared the threshold, so
              it is statistically flagged at the declared error rate and causally unverified —
              confirming cause requires retraining without that shard, which needs pipeline access
              above this assessment depth.
            </Notice>
          </div>
          <Sub title="F-2 as recorded" meta="α = 0.05">
            <DL rows={[
              ['Statistic', <span className="id">e_value_merged</span>],
              ['Value', <span className="id">312.0</span>],
              ['Threshold at k=1', <span className="id">240.0</span>],
              ['Sources tested', '12'],
              ['Size normalised', <Status kind="ok">true</Status>],
              ['Evidence strength', <Status kind="neutral">indicative</Status>],
              ['Attribution mode', <span className="id">set_valued</span>],
              ['Containment scope', <span className="id">lot-07</span>],
            ]} />
          </Sub>
        </div>
      </Section>

      <Section
        title="Detectors"
        meta="4 merged"
        note="One merge rule covers all four, so the source-level number does not depend on which detector fired."
      >
        <div className="cols cols-2">
          <div className="table-wrap">
            <table>
              <thead><tr><th style={{ width: 220 }}>Detector</th><th>Statistic</th></tr></thead>
              <tbody>
                {DETECTORS.map(([name, stat]) => (
                  <tr key={name}>
                    <td className="t-key">{name}</td>
                    <td className="t-wrap">{stat}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div>
            <Notice>
              <b>One detector carries a precondition, and the console prints it.</b> The
              out-of-distribution detector compares against a backbone trained on other data, and
              that data must be disjoint from the shards assessed, or the reference is contaminated
              by the attack it is looking for. A violation returns{' '}
              <span className="id">assessment_unavailable: backbone_corpus_contaminated</span>.
            </Notice>
            <DL rows={[
              ['Backbone disjoint from shards', <Status kind="ok">true</Status>],
              ['Pinned to battery generation', <span className="id">7</span>],
            ]} />
          </div>
        </div>
      </Section>

      <Section
        title="Drift or manipulation"
        meta="manipulation indicated"
        note="A model can also degrade because the world changed around it. That is ruled out before attribution. The discriminator is contributor concentration: benign change spreads across sources, manipulation does not."
      >
        <div className="cols cols-2">
          <div>
            <Ev label="Sources carrying the effect" value={`${D.contributors_carrying_the_effect} / ${D.contributors_total}`} tone="warn" lg
              note={`Concentration index ${D.concentration_index} · reference p ≤ 0.01538`} />
            <Ev label="Shift decomposition" value={`concept ${D.watch_decomposition.concept_shift}`}
              note={`Covariate ${D.watch_decomposition.covariate_shift} — concept-dominant, which drift does not produce`} />
            <Ev label="Input conditionality"
              value={`${D.input_conditionality.effect_present_on_triggered_inputs} / ${D.input_conditionality.effect_present_on_clean_inputs}`}
              note="Triggered against clean inputs — drift is not input-conditional" />
            <Ev label="Verdict" value="manipulation indicated" tone="warn"
              note={`Evidence strength: ${D.evidence_strength}`} />
          </div>
          <Sub title="Demoted to corroborating only">
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>Statistic</th><th className="t-num" style={{ width: 80 }}>Value</th><th style={{ width: 150 }}>May decide alone</th></tr>
                </thead>
                <tbody>
                  {D.corroborating_only.map(c => (
                    <tr key={c.statistic}>
                      <td className="t-id">{c.statistic}</td>
                      <td className="t-num">{c.value}</td>
                      <td><Status kind="quiet">false</Status></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="section-note" style={{ marginTop: 12, marginBottom: 0 }}>
              A season, a sensor swap or a single deployment theatre is itself a subset of the data,
              so a concentration measure over shards fails in both directions. JPEG re-encoding and
              sharpening move a spectral band ratio for benign reasons. Neither may carry a
              decision, and the emitted report names them in a field.
            </p>
          </Sub>
        </div>
      </Section>
    </>
  )
}
