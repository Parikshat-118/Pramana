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

/** A rule-separated region. Sections do not nest and do not draw cards. */
export function Section({ title, meta, actions, note, children }) {
  return (
    <section className="section">
      <div className="section-head">
        <h2>{title}</h2>
        {meta && <span className="section-meta">{meta}</span>}
        <div className="section-spacer" />
        {actions}
      </div>
      {note && <p className="section-note">{note}</p>}
      {children}
    </section>
  )
}

/** A labelled block inside a section column — underline only, no container. */
export function Sub({ title, meta, children }) {
  return (
    <div className="sub">
      {title && (
        <div className="sub-head">
          <span>{title}</span>
          {meta && <span className="section-meta">{meta}</span>}
        </div>
      )}
      {children}
    </div>
  )
}

/* ----------------------------------------------------------------- status --- */

/** Use only for an actual state. `kind`: ok | warn | crit | neutral | quiet */
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

/* ----------------------------------------------------------------- notice --- */

export function Notice({ kind, children }) {
  return <div className={`notice${kind ? ' ' + kind : ''}`}>{children}</div>
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

/** Hover definition for vocabulary that a reviewer may not share. */
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
