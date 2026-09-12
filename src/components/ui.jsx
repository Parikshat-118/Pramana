import React, { useState, useRef, useCallback } from 'react'
import { glossary } from '../lib/glossary.js'

/* -------------------------------------------------------------- page head --- */

export function PageHead({ title, subtitle, meta }) {
  return (
    <header className="page-head">
      <h1 className="page-title">{title}</h1>
      {subtitle && <div className="page-subtitle">{subtitle}</div>}
      {meta && <div className="page-meta">{meta}</div>}
    </header>
  )
}

/* ---------------------------------------------------------------- section --- */

/** One surface level. Sections are the card; nothing inside a section is a card. */
export function Section({ title, meta, actions, note, flush, children }) {
  return (
    <section className="section">
      <div className="section-head">
        <h2>{title}</h2>
        {meta && <span className="section-meta">{meta}</span>}
        <div className="section-spacer" />
        {actions}
      </div>
      <div className={`section-body${flush ? ' flush' : ''}`}>
        {note && <p className="section-note">{note}</p>}
        {children}
      </div>
    </section>
  )
}

/** A labelled block inside a section — underline only, never a nested card. */
export function Block({ title, meta, children }) {
  return (
    <div className="block">
      {title && (
        <div className="block-head">
          <span>{title}</span>
          {meta && <span className="section-meta">{meta}</span>}
        </div>
      )}
      {children}
    </div>
  )
}

/* ------------------------------------------------------------ finding rec --- */

/**
 * A finding is a record, not a paragraph: severity, identifier, subject, asset,
 * then the figures that support it.
 */
export function Finding({ severity = 'warn', label, id, title, asset, children }) {
  const sevLabel = label ?? { crit: 'critical', warn: 'high', ok: 'info' }[severity]
  return (
    <div className={`finding ${severity}`}>
      <div className="finding-head">
        <span className={`sev ${severity}`}>{sevLabel}</span>
        {id && <span className="finding-id">{id}</span>}
        <h3 className="finding-title">{title}</h3>
        <div className="section-spacer" />
        {asset && <span className="finding-asset id">{asset}</span>}
      </div>
      <div className="finding-body">{children}</div>
    </div>
  )
}

/* ----------------------------------------------------------------- figures --- */

export function Figures({ children }) {
  return <div className="figures">{children}</div>
}

/** A figure with its denominator typeset separately, plus the comparison it meets. */
export function Figure({ value, denom, label, sub, tone, sm }) {
  return (
    <div className="figure">
      <div className={`fig${tone ? ' ' + tone : ''}`}>
        <span className={`fig-n${sm ? ' sm' : ''}`}>{value}</span>
        {denom != null && <span className="fig-d">/{denom}</span>}
      </div>
      <div className="figure-label">{label}</div>
      {sub && <div className="figure-sub">{sub}</div>}
    </div>
  )
}

/* ----------------------------------------------------------------- status --- */

/** Use only for an actual state. kind: ok | warn | crit | neutral | quiet */
export function Status({ kind = 'neutral', strike, children }) {
  return <span className={`st ${kind}${strike ? ' strike' : ''}`}>{children}</span>
}

/* ----------------------------------------------------------------- metrics --- */

export function Metrics({ children }) {
  return <div className="metrics">{children}</div>
}

/**
 * One cell of a metric strip. `context` carries the value the figure is checked
 * against — the floor it beats, the ceiling it stays under, the total it sums to.
 */
export function Metric({ label, value, context, tone, sm }) {
  return (
    <div className="metric">
      <div className="metric-label">{label}</div>
      <div className={`metric-value${sm ? ' sm' : ''}${tone ? ' ' + tone : ''}`}>{value}</div>
      {context && <div className="metric-context">{context}</div>}
    </div>
  )
}

/* ------------------------------------------------------------ definitions --- */

/** rows: [label, value][] */
export function DL({ rows, left }) {
  return (
    <dl className={`dl${left ? ' left' : ''}`}>
      {rows.map(([k, v], i) => (
        <React.Fragment key={i}>
          <dt>{k}</dt>
          <dd>{v}</dd>
        </React.Fragment>
      ))}
    </dl>
  )
}

/* --------------------------------------------------------------- evidence --- */

export function Ev({ label, value, tone, lg, note }) {
  return (
    <div className="ev">
      <div className="ev-label">
        {label}
        {note && <div className="ev-note">{note}</div>}
      </div>
      <div className={`ev-value${lg ? ' lg' : ''}${tone ? ' ' + tone : ''}`}>{value}</div>
    </div>
  )
}

/* ---------------------------------------------------------------- callout --- */

/** A labelled technical note. The label carries the meaning; the body stays short. */
export function Callout({ kind, label, children }) {
  return (
    <div className={`callout${kind ? ' ' + kind : ''}`}>
      {label && <span className="callout-label">{label}</span>}
      <div className="callout-body">{children}</div>
    </div>
  )
}

/* ---------------------------------------------------------------- toolbar --- */

export function Toolbar({ hint, children }) {
  return (
    <div className="toolbar">
      {children}
      {hint && <span className="toolbar-hint">{hint}</span>}
    </div>
  )
}

/* -------------------------------------------------------------------- bar --- */

export function Bar({ value, max = 1, tone = 'neutral', label, right }) {
  const w = Math.max(0, Math.min(100, (value / max) * 100))
  return (
    <div>
      {label && (
        <div className="bar-head">
          <span>{label}</span>
          {right && <span className="num">{right}</span>}
        </div>
      )}
      <div className="bar"><i className={tone} style={{ width: `${w}%` }} /></div>
    </div>
  )
}

/* -------------------------------------------------------------- reference --- */

/** A technical identifier in monospace, with a copy action. */
export function Ref({ value, children }) {
  const [done, setDone] = useState(false)
  const text = value ?? String(children ?? '')

  const copy = () => {
    const write = navigator.clipboard?.writeText(text)
    if (write) {
      write.then(() => { setDone(true); setTimeout(() => setDone(false), 1200) }, () => {})
    }
  }

  return (
    <span className="ref">
      <span className="id">{children ?? value}</span>
      <button
        className={`ref-copy${done ? ' done' : ''}`}
        onClick={copy}
        title={done ? 'Copied' : `Copy ${text}`}
        aria-label={`Copy ${text}`}
      >
        {done ? '✓' : '⧉'}
      </button>
    </span>
  )
}

/* ------------------------------------------------------------------- term --- */

/** Hover definition for vocabulary a reviewer may not share. */
export function Term({ id, children }) {
  const entry = glossary[id]
  const [pos, setPos] = useState(null)
  const ref = useRef(null)

  const show = useCallback(() => {
    const r = ref.current?.getBoundingClientRect()
    if (!r) return
    const left = Math.min(Math.max(10, r.left - 6), window.innerWidth - 310)
    const above = r.top > 200
    setPos({ left, top: above ? r.top - 8 : r.bottom + 8, above })
  }, [])

  const hide = useCallback(() => setPos(null), [])

  if (!entry) return <>{children}</>

  return (
    <>
      <span ref={ref} className="term" tabIndex={0}
        onMouseEnter={show} onMouseLeave={hide} onFocus={show} onBlur={hide}>
        {children ?? entry.term}
      </span>
      {pos && (
        <span className="tip" role="tooltip"
          style={{ left: pos.left, top: pos.top, transform: pos.above ? 'translateY(-100%)' : 'none' }}>
          <span className="tip-h">{entry.term}</span>
          {entry.body}
        </span>
      )}
    </>
  )
}

/* ------------------------------------------------------------------ utils --- */

export function pct(x, d = 1) { return (x * 100).toFixed(d) + '%' }

export function Legend({ items }) {
  return (
    <div className="legend">
      {items.map(([colour, label]) => (
        <span className="legend-item" key={label}>
          <i style={{ background: colour }} />{label}
        </span>
      ))}
    </div>
  )
}

/** Shared 200-probe bank view. Diverging indices are fixed, not sampled. */
export const HOT_PROBES = [7, 23, 31, 58, 74, 96, 112, 133, 151, 178, 194]

export function Probes({ diverging, total = 200, strip }) {
  const hot = new Set(HOT_PROBES.slice(0, diverging))
  return (
    <div className={`probes${strip ? ' strip' : ''}`}>
      {Array.from({ length: total }, (_, i) => (
        <i key={i} className={hot.has(i) ? 'hit' : undefined} />
      ))}
    </div>
  )
}

/** Per-class divergence chart. `sm` renders the compact inline variant. */
export function DivergenceChart({ data, sm, axis }) {
  const max = Math.max(...data.map(d => d.divergence), 0.05)
  return (
    <>
      <div className={`chart${sm ? ' sm' : ''}`}>
        {data.map(d => (
          <div className="chart-col" key={d.cls}
            title={`Class ${d.cls} — ${d.name}\nDivergence ${d.divergence.toFixed(3)}`}>
            <i
              className={d.divergence >= 0.3 ? 'hi' : d.divergence >= 0.1 ? 'mid' : undefined}
              style={{ height: `${(d.divergence / max) * 100}%` }}
            />
            {!sm && d.divergence >= 0.3 && <span className="chart-tag">{d.cls}</span>}
          </div>
        ))}
      </div>
      {axis && (
        <div className="chart-axis">
          <span className="id">cls 0</span>
          <span>43 output classes</span>
          <span className="id">cls 42</span>
        </div>
      )}
    </>
  )
}
