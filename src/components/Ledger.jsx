import React, { useState } from 'react'
import {
  PageHead, Section, Sub, Status, Metrics, Metric, DL, Ev, Notice, Toolbar, Ref, Term, Legend,
} from './ui.jsx'
import { report, ledgerEntries } from '../data/report.js'

const A = report.ledger.external_anchor
const ALTERED = 'sha256:9b3f…0c21'

const KIND = {
  battery_commit: ['neutral', 'pre-commitment'],
  taxonomy_commit: ['neutral', 'pre-commitment'],
  admission: ['quiet', 'admission'],
  conversion: ['quiet', 'conversion'],
  finding: ['warn', 'finding'],
  disposition: ['warn', 'disposition'],
}

export default function Ledger() {
  const [tampered, setTampered] = useState(null)
  const broken = pos => tampered !== null && pos >= tampered

  return (
    <>
      <PageHead
        title="Ledger & anchor"
        subtitle="Append-only hash chain with independent timestamp"
        meta={<>Head <span className="id">{report.ledger.chain_position}</span> · {ledgerEntries.length} rows · anchor <span className="id">{A.anchor_procedure}</span> · verifiable offline</>}
      />

      <Toolbar hint={tampered !== null
        ? 'Row 88213 altered. Both verifications fail.'
        : 'Both verifications pass.'}>
        <button className="crit" onClick={() => setTampered(88213)} disabled={tampered !== null}>
          Alter row 88213
        </button>
        <button onClick={() => setTampered(null)} disabled={tampered === null}>Restore chain</button>
      </Toolbar>

      <Metrics>
        <Metric
          label="Local chain" value={tampered !== null ? 'Broken' : 'Intact'}
          tone={tampered !== null ? 'crit' : 'ok'} sm
          context={tampered !== null
            ? <>First mismatch at position <b>88213</b></>
            : <>Every previous-digest recomputes</>}
        />
        <Metric
          label="Independent timestamp" value={tampered !== null ? 'Mismatch' : 'Anchored'}
          tone={tampered !== null ? 'crit' : 'ok'} sm
          context={tampered !== null
            ? <>Token attests a root the chain no longer presents</>
            : <>Lag <b>{A.anchor_lag_s}s</b> against an 86400s batch interval</>}
        />
        <Metric
          label="Pre-commitment" value="2 rows" tone="ok"
          context={<>Battery and taxonomy committed 6 days before receipt</>}
        />
        <Metric
          label="Signature" value="Ed25519" sm tone="ok"
          context={<span className="id">{report.signature.key_id}</span>}
        />
      </Metrics>

      {tampered !== null && (
        <Notice kind="crit">
          <b>Row 88213 was altered — the row recording finding F-1.</b> Local chain verification
          fails from that row forward, which a certifier could have suppressed by recomputing the
          whole chain. The same row is then checked against the timestamp token obtained{' '}
          <b>before</b> the edit, and that check fails too — on a digest whose signing key the
          certifier does not hold and therefore cannot re-issue.
        </Notice>
      )}

      <Section title="Verification">
        <div className="cols cols-2">
          <Sub
            title="Check 1 — local chain"
            meta={tampered !== null ? 'failed' : 'verified'}
          >
            <Ev label="Chain state" value={tampered !== null ? 'BROKEN' : 'INTACT'}
              tone={tampered !== null ? 'crit' : 'ok'} lg
              note={tampered !== null
                ? 'Stored previous-digest no longer matches row 88212'
                : `${ledgerEntries.length} rows, head at ${report.ledger.chain_position}`} />
            <DL rows={[
              ['Chain position', <span className="id">{report.ledger.chain_position}</span>],
              ['Previous digest', <Ref value={report.ledger.prev_digest}>{report.ledger.prev_digest}</Ref>],
              ['Merkle root', tampered !== null
                ? <span className="id" style={{ color: 'var(--crit)' }}>{ALTERED}</span>
                : <Ref value={report.ledger.merkle_root}>{report.ledger.merkle_root}</Ref>],
              ['Signature algorithm', <span className="id">{report.signature.alg}</span>],
            ]} />
            <p className="section-note" style={{ marginTop: 12, marginBottom: 0 }}>
              Run by the certifier on the certifier's own data. Alone it proves nothing to anybody
              else.
            </p>
          </Sub>

          <Sub
            title="Check 2 — independent timestamp"
            meta={tampered !== null ? 'failed' : 'anchored'}
          >
            <Ev label="Third-party verification" value={tampered !== null ? 'MISMATCH' : 'ANCHORED'}
              tone={tampered !== null ? 'crit' : 'ok'} lg
              note={tampered !== null
                ? `Token attests ${report.ledger.merkle_root}; chain presents ${ALTERED}`
                : 'Signed statement from an outside authority'} />
            <DL rows={[
              ['Procedure', <span className="id">{A.anchor_procedure}</span>],
              ['State', <Status kind={tampered !== null ? 'crit' : 'ok'}>{A.anchor_state}</Status>],
              ['Token digest', <Ref value={A.token_digest}>{A.token_digest}</Ref>],
              ['Anchored at', <span className="id">{A.anchor_utc}</span>],
              ['Verifiable offline', <Status kind="ok">true</Status>],
            ]} />
            <p className="section-note" style={{ marginTop: 12, marginBottom: 0 }}>
              Verifies with no network connection. Re-issuing it would require a key the certifier
              does not have, which is what makes this the one check that does not rest on trusting
              the certifier.
            </p>
          </Sub>
        </div>
      </Section>

      <Section title="Audit log" meta={`${ledgerEntries.length} rows · append-only`}>
        <div className="cols cols-2-1">
          <div>
            {ledgerEntries.map((entry, i) => {
              const [kind, label] = KIND[entry.kind]
              return (
                <div className="chain-row" key={entry.pos}>
                  <div className="chain-rail">
                    <div className={`chain-dot ${
                      broken(entry.pos) ? 'broken' : entry.beforeArtefact ? 'pre' : 'ok'
                    }`} />
                    {i < ledgerEntries.length - 1 && (
                      <div className={`chain-bar${broken(ledgerEntries[i + 1].pos) ? ' broken' : ''}`} />
                    )}
                  </div>
                  <div className="chain-cell">
                    <div className="chain-top">
                      <span className="chain-pos">{entry.pos}</span>
                      <span className="chain-label">{entry.label}</span>
                      <div style={{ flex: 1 }} />
                      <Status kind={broken(entry.pos) ? 'crit' : kind}>
                        {broken(entry.pos) ? 'digest mismatch' : label}
                      </Status>
                    </div>
                    <div className={`chain-sub${broken(entry.pos) && entry.pos === tampered ? ' altered' : ''}`}>
                      {entry.utc} · {broken(entry.pos) && entry.pos === tampered
                        ? `${ALTERED} (altered)`
                        : entry.digest}
                    </div>
                  </div>
                </div>
              )
            })}
            <hr className="r" />
            <Legend items={[
              ['var(--bg-alt)', 'committed before receipt'],
              ['var(--ok-bg)', 'verified'],
              ['var(--crit)', 'digest mismatch'],
            ]} />
          </div>

          <div>
            <Sub title="Pre-commitment" meta="before receipt">
              <DL rows={[
                ['Committed at', <span className="id">{report.battery.committed_at_utc}</span>],
                ['Before artefact receipt', <Status kind="ok">true</Status>],
                ['Battery A', <Ref value={report.battery.battery_a_digest}>{report.battery.battery_a_digest}</Ref>],
                ['Battery B', <Status kind="neutral">unopened</Status>],
                ['Taxonomy', <Ref value={report.battery.taxonomy_digest}>{report.battery.taxonomy_digest}</Ref>],
                ['Thresholds', <Ref value={report.battery.threshold_file_digest}>{report.battery.threshold_file_digest}</Ref>],
                ['Generation', <span className="id">{report.battery.generation}</span>],
              ]} />
              <p className="section-note" style={{ marginTop: 12, marginBottom: 0 }}>
                The battery digest sits at position 88209, six days ahead of admission at 88211. In
                a dispute the battery is opened so the vendor can recompute the digest — a finding
                the accused party cannot check is not evidence.{' '}
                <Term id="precommit">Pre-commitment</Term> is what makes that possible.
              </p>
            </Sub>

            <Sub title="Stated limits">
              <Ev label="Defeats" value={<Status kind="ok">yes</Status>}
                note={A.defeats[0]} />
              <Ev label="Does not defeat" value={<Status kind="crit">no</Status>}
                note={A.does_not_defeat[0]} />
              <p className="section-note" style={{ marginTop: 12, marginBottom: 0 }}>
                It converts <i>trust us</i> into <i>trust us or catch us</i>, which is the honest
                version of what a distributed ledger is usually claimed to provide. Both fields are
                in the emitted report, not only on this screen.
              </p>
            </Sub>
          </div>
        </div>
      </Section>
    </>
  )
}
