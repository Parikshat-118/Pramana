import React, { useState } from 'react'
import {
  PageHead, Section, Block, Status, Metrics, Metric, DL, Ev, Bar, Callout, Toolbar, Ref, Term, Legend, pct,
} from './ui.jsx'
import { report } from '../data/report.js'

const F1 = report.findings[0]
const S = F1.surrogate

/** Recovered mask — 32×32, a 7×7 patch in the lower-right quadrant. */
function Mask({ visible }) {
  const cells = []
  for (let y = 0; y < 32; y++) {
    for (let x = 0; x < 32; x++) {
      const patch = x >= 23 && x <= 29 && y >= 23 && y <= 29
      const halo = x >= 22 && x <= 30 && y >= 22 && y <= 30
      let bg = '#e4e7eb'
      if (visible && patch) bg = (x + y) % 2 === 0 ? '#d99a1c' : '#8f6008'
      else if (visible && halo) bg = '#f0e3c4'
      cells.push(<i key={`${x}-${y}`} style={{ background: bg }} />)
    }
  }
  return <div className="mask">{cells}</div>
}

export default function Reversal() {
  const [showMask, setShowMask] = useState(true)

  return (
    <>
      <PageHead
        title="Trigger reversal"
        subtitle="Per-class minimal-perturbation solve, FP32 and INT8"
        meta={<>Parameterisation <span className="id">patch_l1</span> · 43 classes tested · FDR 0.05 · battery generation 7</>}
      />

      <Metrics>
        <Metric
          label="FP32" value="0.44" tone="ok"
          context={<>Critical value <b>0.00116</b> → not reported</>}
        />
        <Metric
          label="INT8 deployment build" value="0.00073" tone="warn"
          context={<>Critical value <b>0.00116</b> → reported · floor <b>0.00036</b></>}
        />
        <Metric
          label="Target class" value="14" tone="warn" sm
          context={<>STOP · recovered patch 7 × 7 px, lower-right</>}
        />
        <Metric
          label="Attack success rate" value={pct(S.forward_pass_asr_on_delivered_int8)} tone="warn"
          context={<>Measured on the delivered INT8 binary, not the surrogate</>}
        />
      </Metrics>

      <Callout kind="warn" label="Same search · same class · opposite results">
        A backdoor that activates only after conversion is invisible to any assessment of the
        delivered file, so the search runs at the precision that deploys.
      </Callout>

      <Section title="Result by rung">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th style={{ width: 130 }}>Rung</th>
                <th style={{ width: 200 }}>Role</th>
                <th style={{ width: 110 }} className="t-num">p pooled</th>
                <th style={{ width: 110 }} className="t-num">Critical</th>
                <th style={{ width: 100 }} className="t-num">Floor</th>
                <th style={{ width: 130 }}>Result</th>
                <th>Note</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="t-id">fp32</td>
                <td>Delivered and signed</td>
                <td className="t-num">0.44</td>
                <td className="t-num">0.00116</td>
                <td className="t-num">0.00036</td>
                <td><Status kind="ok">no finding</Status></td>
                <td className="t-wrap">Every FP32 check in the battery returns no finding.</td>
              </tr>
              <tr className="flagged">
                <td className="t-id">int8_ptq</td>
                <td>Deployment build</td>
                <td className="t-num">0.00073</td>
                <td className="t-num">0.00116</td>
                <td className="t-num">0.00036</td>
                <td><Status kind="warn">reported</Status></td>
                <td className="t-wrap">Class 14 (STOP) is the target. Patch L1 norm far below the reference band.</td>
              </tr>
            </tbody>
          </table>
        </div>
        <DL left rows={[
          ['Statistic', <span className="id">{F1.statistic.name}</span>],
          ['Reference population', <span className="id">{F1.statistic.null_population}</span>],
          ['Multiplicity correction', `Benjamini-Hochberg over ${F1.statistic.bh_classes_tested} classes at FDR ${F1.statistic.fdr}`],
          ['Adjusted q', <span className="id">{F1.statistic.bh_adjusted_q}</span>],
          ['Reported only because', 'detection fired on the precision ladder'],
        ]} />
      </Section>

      <Section
        title="Recovered trigger"
        meta="release L-A · local only"
        actions={
          <Toolbar hint={showMask ? 'Pattern shown' : 'Pattern withheld, as by default'}>
            <div className="btn-group">
              <button className={showMask ? 'on' : ''} onClick={() => setShowMask(true)}>Show</button>
              <button className={!showMask ? 'on' : ''} onClick={() => setShowMask(false)}>Withhold</button>
            </div>
          </Toolbar>
        }
      >
        <div className="cols cols-1-2">
          <div>
            <Mask visible={showMask} />
            <div style={{ marginTop: 12 }}>
              <Legend items={[
                ['#d99a1c', 'recovered mask'],
                ['#f0e3c4', 'surrounding region'],
                ['#e4e7eb', 'unchanged'],
              ]} />
            </div>
            <hr className="r" />
            <DL rows={[
              ['Parameterisation', <span className="id">{F1.parameterisation}</span>],
              ['Also searched', <span className="id">blend_linf · dct_band</span>],
              ['Patch size', '7 × 7 px, lower-right quadrant'],
              ['Release level', <Status kind="neutral">{report.ioc.release_level} local</Status>],
            ]} />
            <p className="section-note" style={{ marginTop: 12, marginBottom: 0 }}>
              Sharing a recovered trigger tells whoever planted it which implant was found, so the
              default <Term id="ioc">release level</Term> discloses nothing outside the assessing
              authority.
            </p>
          </div>

          <div>
            <Block title="Surrogate gate" meta="passed">
              <p className="section-note">
                An INT8 graph exposes no gradients, so the search runs on a differentiable
                stand-in built from the delivered scale table. Evidence is then taken off the real
                INT8 binary by forward pass — two separate fields in the report.
              </p>
              <Ev label="Agreement with the real binary" value={S.surrogate_exact_agreement.toFixed(3)} tone="ok"
                note={`Floor ${S.surrogate_exact_agreement_floor} → pass`} />
              <Ev label="Mean output distance" value={S.surrogate_mean_logit_distance.toFixed(3)} tone="ok"
                note={`Ceiling ${S.surrogate_mean_logit_distance_ceiling} → pass`} />
              <Ev label="Search ran on" value="surrogate" />
              <Ev label="Evidence ran on" value="delivered INT8 binary" tone="ok" />
              <div style={{ marginTop: 12 }}>
                <Bar
                  value={S.forward_pass_asr_on_delivered_int8} tone="warn"
                  label={<><Term id="asr">Attack success rate</Term>, delivered INT8 binary</>}
                  right={pct(S.forward_pass_asr_on_delivered_int8)}
                />
              </div>
              <p className="section-note" style={{ marginTop: 12, marginBottom: 0 }}>
                Had the gate failed, the field would read{' '}
                <span className="id">assessment_unavailable: surrogate_not_faithful</span> and no
                finding would have been recorded.
              </p>
            </Block>

            <Block title="Finding F-1" meta="corroborated">
              <DL rows={[
                ['Mechanism', <span className="id">{F1.mechanism}</span>],
                ['Rung', <span className="id">{F1.rung}</span>],
                ['Class', '14 (STOP)'],
                ['Evidence strength', <Status kind="warn">{F1.evidence_strength}</Status>],
                ['Corroborating mechanisms', <span className="id">{F1.corroborating_mechanisms.join(' · ')}</span>],
                ['Attribution mode', <span className="id">{F1.attribution_mode}</span>],
                ['Attribution set', <>{F1.attribution_set.join(', ')} (size {F1.attribution_set_size})</>],
                ['Containment scope', <span className="id">{F1.containment_scope.join(', ')}</span>],
                ['Scale table', <Ref value={S.scale_table_digest}>{S.scale_table_digest}</Ref>],
              ]} />
              <Callout label="Attribution ceiling · set of one">
                Naming a single supplier requires{' '}
                <Term id="strength">causal verification</Term> — retraining without that shard and
                watching the effect disappear. This finding is corroborated, so the attribution
                stays <Term id="setvalued">set-valued</Term>.
              </Callout>
            </Block>
          </div>
        </div>
      </Section>
    </>
  )
}
