import React, { useState } from 'react'
import {
  PageHead, Section, Block, Status, Metrics, Metric, DL, Ev, Bar, Callout, Toolbar, Term, pct,
} from './ui.jsx'
import { report } from '../data/report.js'

const SCM = report.supplier_concentration_measurement

const SCENARIOS = {
  base: {
    id: 'base', label: '12 lots, as let',
    shares: [0.21, 0.17, 0.13, 0.11, 0.09, 0.08, 0.06, 0.05, 0.04, 0.03, 0.02, 0.01],
    names: ['lot-01', 'lot-02', 'lot-03', 'lot-04', 'lot-05', 'lot-06', 'lot-07', 'lot-08', 'lot-09', 'lot-10', 'lot-11', 'lot-12'],
    k: 3, fraction: 0.712, ensembleTop1: 0.891,
  },
  merged: {
    id: 'merged', label: 'Two lots share a parent',
    shares: [0.38, 0.13, 0.11, 0.09, 0.08, 0.06, 0.05, 0.04, 0.03, 0.02, 0.01],
    names: ['lot-01+02', 'lot-03', 'lot-04', 'lot-05', 'lot-06', 'lot-07', 'lot-08', 'lot-09', 'lot-10', 'lot-11', 'lot-12'],
    k: 2, fraction: 0.664, ensembleTop1: 0.877,
  },
  degenerate: {
    id: 'degenerate', label: 'Top three consolidated',
    shares: [0.51, 0.11, 0.09, 0.08, 0.06, 0.05, 0.04, 0.03, 0.02, 0.01],
    names: ['lot-01+02+03', 'lot-04', 'lot-05', 'lot-06', 'lot-07', 'lot-08', 'lot-09', 'lot-10', 'lot-11', 'lot-12'],
    k: 1, fraction: 0.598, ensembleTop1: 0.861,
  },
}

export default function Certificate() {
  const [sc, setSc] = useState('base')
  const S = SCENARIOS[sc]
  const m = S.shares.length
  const topKShare = S.shares.slice(0, S.k).reduce((a, b) => a + b, 0)
  const sum = S.shares.reduce((a, b) => a + b, 0)
  const largest = S.shares[0]
  const withheld = largest > SCM.volume_inequality.degenerate_threshold
  const delivered = SCM.surrogate_gap_top1.single_delivered_model

  return (
    <>
      <PageHead
        title="Supplier certificate"
        subtitle="Supplier-concentration measurement, denominated in contract lots"
        meta={<>12-partition run-off ensemble · basis <span className="id">contract_lot</span> · evaluation set <span className="id">gtsrb-holdout-n4410</span></>}
      />

      <Callout label="Scope of this measurement">
        A property of the voting ensemble built for the measurement, not of the delivered model.
        The guarantee and the precision-ladder result concern different objects and do not
        compose. Exclusions carried as a field:{' '}
        <span className="id">{SCM.scope_excludes.join(', ')}</span>.
      </Callout>

      <Toolbar hint="Contract structure changes the guarantee. It is not a property of the model alone.">
        <div className="btn-group">
          {Object.values(SCENARIOS).map(s => (
            <button key={s.id} className={sc === s.id ? 'on' : ''} onClick={() => setSc(s.id)}>
              {s.label}
            </button>
          ))}
        </div>
      </Toolbar>

      <Metrics>
        <Metric
          label="certified_floor_k"
          value={withheld ? 'Withheld' : `${S.k} / ${m}`}
          tone={withheld ? 'crit' : 'ok'}
          sm={withheld}
          context={withheld
            ? <>Reason <span className="id">single_lot_majority</span></>
            : <>Those {S.k} lots hold <b>{pct(topKShare, 0)}</b> of corpus volume</>}
        />
        <Metric
          label="Certified inputs"
          value={withheld ? '—' : pct(S.fraction)}
          context={<>The remainder receive a prediction with no guarantee</>}
        />
        <Metric
          label="Accuracy given up"
          value={withheld ? '—' : `−${((delivered - S.ensembleTop1) * 100).toFixed(1)} pts`}
          tone={withheld ? undefined : 'warn'}
          context={<>Delivered <b>{pct(delivered)}</b> → voted ensemble <b>{pct(S.ensembleTop1)}</b></>}
        />
        <Metric
          label="Partition purity"
          value={SCM.partition_purity.purity.toFixed(4)} tone="ok"
          context={<>Floor <b>{SCM.partition_purity.purity_floor}</b> → pass</>}
        />
      </Metrics>

      {withheld ? (
        <Callout kind="crit" label="Certificate withheld · single lot majority">
          The largest lot is {pct(largest, 0)} of the corpus, past the{' '}
          {pct(SCM.volume_inequality.degenerate_threshold, 0)} threshold. Refused outright rather
          than issued with a caveat — the remedy is to re-let the contract, not to find a more
          forgiving statistic.
        </Callout>
      ) : sc === 'merged' ? (
        <Callout kind="warn" label="Floor reduced · shared parent company">
          Two lots cannot fail independently, so the floor drops from 3 to 2. How the corpus is
          partitioned is a procurement choice, which means the guarantee can be designed for.
        </Callout>
      ) : (
        <Callout kind="ok" label="Per-prediction guarantee">
          For a certified input, the label this ensemble votes for is unchanged under arbitrary
          corruption of any <b>{S.k - 1}</b> contracted lots.
        </Callout>
      )}

      <Section
        title="Volume across the partition"
        meta={withheld ? 'degenerate' : 'within bounds'}
        note="A poisoner inside the largest lot needs a far lower rate within their own delivery to reach the same corpus-level effect than one inside the smallest, so the count is read beside the volume share and both appear in the same object."
      >
        <div className="cols cols-2-1">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th style={{ width: 140 }}>Lot</th>
                  <th>Corpus volume</th>
                  <th style={{ width: 80 }} className="t-num">Share</th>
                  <th style={{ width: 170 }}>In certified floor</th>
                </tr>
              </thead>
              <tbody>
                {S.shares.map((sh, i) => {
                  const inTopK = i < S.k && !withheld
                  const majority = i === 0 && withheld
                  return (
                    <tr key={S.names[i]} className={majority ? 'flagged' : inTopK ? 'selected' : ''}>
                      <td className="t-id">{S.names[i]}</td>
                      <td><Bar value={sh} max={0.55} tone={majority ? 'crit' : inTopK ? 'warn' : 'neutral'} /></td>
                      <td className="t-num">{pct(sh, 0)}</td>
                      <td>
                        {majority ? <Status kind="crit">majority holder</Status>
                          : inTopK ? <Status kind="warn">yes</Status>
                          : <Status kind="quiet">no</Status>}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <div>
            <Block title="Volume checks">
              <Ev label="Shares sum" value={`${sum.toFixed(2)} = 1.00`} tone="ok" />
              <Ev label="Largest single lot" value={pct(largest, 0)} tone={withheld ? 'crit' : undefined} />
              <Ev label="Degenerate threshold" value={pct(SCM.volume_inequality.degenerate_threshold, 0)} />
              <Ev label="k is a count, not a volume" value="true" note="Which is why the share is printed beside it" />
            </Block>
            <Block title="Pairing enforced at build">
              <p className="section-note">
                <span className="id">certified_floor_k</span> is rejected by the validator unless
                both companions are present in the same object, which is what makes the figure
                unquotable alone.
              </p>
              <DL rows={[
                ['certified_fraction_at_k', <Status kind="ok">present</Status>],
                ['surrogate_gap_top1', <Status kind="ok">present</Status>],
              ]} />
            </Block>
          </div>
        </div>
      </Section>

      <Section title="Method" meta={<span className="id">{SCM.mechanism}</span>}>
        <div className="cols cols-2">
          <DL left rows={[
            ['Partitions', SCM.partitions],
            ['Partition basis', <span className="id">{SCM.partition_basis}</span>],
            ['Disjointness enforced', <Status kind="ok">true</Status>],
            ['Purity floor', <span className="id">{SCM.partition_purity.purity_floor}</span>],
            ['Subject', <span className="id">{SCM.subject}</span>],
            ['Sample-denominated comparison', <>{SCM.sample_denominated_comparison.random_partition_k_samples} samples, random partition</>],
          ]} />
          <div>
            <p className="section-note">
              Instead of one model trained on everything, twelve models are trained one per
              supplier and vote on each prediction. Corrupting one supplier changes one vote.{' '}
              <Term id="floork">certified_floor_k</Term> is how many would have to be compromised
              at once before the vote could change.
            </p>
            <Callout label="Trade recorded, not hidden">
              The sample-denominated figure is the <b>tighter</b> bound: a partition aligned to
              contract lots is strictly weaker in sample units than a random one. Both numbers are
              reported side by side.
            </Callout>
            <p className="section-note" style={{ marginBottom: 0 }}>
              If two suppliers deliver the same images their models are not independent and the
              vote is worth less than it appears, so <Term id="purity">purity</Term> is measured,
              printed and gated.
            </p>
          </div>
        </div>
      </Section>
    </>
  )
}
