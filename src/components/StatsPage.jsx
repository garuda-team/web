import { Suspense, lazy, useEffect, useRef, useState } from "react";
import { ui } from "../content.js";
import { stats } from "../content.stats.js";
import { motionOK } from "../lib/motion.js";
import { fmtNum, pointText } from "../lib/statsFormat.js";

/* Recharts lives in its own chunk: it is only fetched when the Stats page opens. */
const StatsChart = lazy(() => import("./StatsChart.jsx"));

const L = ui.statsPage;

/* sourceGroups ids -> group, so a table can point at the groups it cites. */
const GROUPS = new Map((stats.blocks ?? []).flatMap((b) => (b.sourceGroups ?? []).map((g) => [g.id, g])));

/* "36,6 %" / "6.444" / "+5,2 % al año": one clean number with a non-numeric prefix and suffix. Anything else stays fixed. */
function parseKpi(value) {
  const m = /^(\D*?)(\d[\d.,\s\u00a0\u202f]*\d|\d)(\D*)$/.exec(String(value ?? ""));
  if (!m) return null;
  const [, pre, num, post] = m;
  const tokens = num.split(/[.,\s\u00a0\u202f]/);
  const seps = num.match(/[.,\s\u00a0\u202f]/g) ?? [];
  let group = null;
  let dec = null;
  let decimals = 0;
  if (seps.length) {
    const last = seps[seps.length - 1];
    const lastLen = tokens[tokens.length - 1].length;
    const earlier = seps.slice(0, -1);
    const grouped = (list, toks) => list.every((c) => c === list[0]) && toks.slice(1).every((t) => t.length === 3) && toks[0].length <= 3;
    if (seps.length === 1 && lastLen !== 3) {
      dec = last;
      decimals = lastLen;
    } else if (grouped(seps, tokens)) {
      group = last;
    } else if (earlier.length && last !== earlier[0] && grouped(earlier, tokens.slice(0, -1))) {
      group = earlier[0];
      dec = last;
      decimals = lastLen;
    } else return null;
  }
  const target = Number(tokens.slice(0, dec ? -1 : undefined).join("") + (dec ? "." + tokens[tokens.length - 1] : ""));
  if (!Number.isFinite(target)) return null;
  const format = (n) => {
    const [i, f] = n.toFixed(decimals).split(".");
    const withGroup = group ? i.replace(/\B(?=(\d{3})+(?!\d))/g, group) : i;
    return pre + withGroup + (f ? dec + f : "") + post;
  };
  return { target, format };
}

function Kpi({ k }) {
  const ref = useRef(null);
  const [shown, setShown] = useState(k.value);
  useEffect(() => {
    const parsed = parseKpi(k.value);
    if (!parsed || !motionOK() || typeof IntersectionObserver === "undefined") return undefined;
    let raf = 0;
    setShown(parsed.format(0));
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        io.disconnect();
        const t0 = performance.now();
        const tick = (now) => {
          const p = Math.min(1, (now - t0) / 1100);
          if (p >= 1) {
            setShown(k.value);
            return;
          }
          setShown(parsed.format(parsed.target * (1 - Math.pow(1 - p, 3))));
          raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      },
      { threshold: 0.4 },
    );
    io.observe(ref.current);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
      setShown(k.value);
    };
  }, [k.value]);
  return (
    <li className="stats__kpi" ref={ref}>
      <p className="stats__kpi-label">{k.label}</p>
      <p className="stats__kpi-value" aria-live="off" data-value={k.value}>
        <span aria-hidden="true">{shown}</span>
        <span className="sr-only">{k.value}</span>
      </p>
      {k.context ? <p className="stats__kpi-context">{k.context}</p> : null}
    </li>
  );
}

function Kpis({ block }) {
  if (!block.kpis?.length) return null;
  return (
    <ul className="stats__kpis" aria-label={L.kpis}>
      {block.kpis.map((k) => (
        <Kpi key={k.id} k={k} />
      ))}
    </ul>
  );
}

const notesOf = (t) => (t.notes ?? []).filter((n) => n && String(n).trim());

/* Scientific names (same in EN/ES/CA): fixed list, italics only on the matching part. */
const SCI_NAMES = [
  "Myiopsitta monachus", "Psittacula krameri", "Passer domesticus", "Turdus merula",
  "Pica pica", "Sturnus unicolor / vulgaris", "Erithacus rubecula", "Carduelis carduelis",
  "Chloris chloris", "Serinus serinus", "Columba palumbus", "Streptopelia decaocto",
  "Columba livia", "Apus apus", "Chlamydia psittaci", "E. coli", "Salmonella",
  "Campylobacter jejuni", "Leucocytozoon", "Plasmodium", "Haemoproteus",
  "Ornithonyssus bursa", "Culex pipiens", "Circovirus", "Dependoparvovirus",
];
const SCI_RE = new RegExp(
  "\\b(" + [...SCI_NAMES].sort((x, y) => y.length - x.length)
    .map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|") + ")\\b"
);
function sciCell(tableId, v) {
  const t = String(v);
  if (tableId !== "socc" && tableId !== "prevalence") return t;
  const parts = t.split(SCI_RE);
  if (parts.length === 1) return t;
  return <>{parts.map((s, i) => (i % 2 ? <i key={i} lang="la">{s}</i> : s || null))}</>;
}

function Table({ table, folded, fallback }) {
  const title = table.title || fallback;
  const id = `tbl-${table.id}`;
  const body = (
    <div className="stats__table-block">
      {table.intro ? <p className="stats__intro">{table.intro}</p> : null}
      <div className="stats__scroll" role="region" aria-labelledby={`${id}-cap`} tabIndex={0}>
        <table className="stats__table">
          <caption id={`${id}-cap`} className="stats__caption">{title}</caption>
          <thead>
            <tr>
              {table.cols.map((c, i) => (
                <th key={i} scope="col">{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {table.rows.map((row, r) => (
              <tr key={r}>
                {row.map((v, i) => (i === 0 ? <th key={i} scope="row">{sciCell(table.id, v)}</th> : <td key={i}>{v}</td>))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {notesOf(table).length ? (
        <ul className="stats__notes" aria-label={L.notes}>
          {notesOf(table).map((n, i) => (
            <li key={i}>{n}</li>
          ))}
        </ul>
      ) : null}
      {table.sources?.length ? (
        <p className="stats__table-sources">
          <span>{L.sourcesOf}: </span>
          {table.sources.map((s) => GROUPS.get(s)?.title ?? s).join(", ")}
        </p>
      ) : null}
    </div>
  );
  if (!folded) return body;
  return (
    <details className="stats__details">
      <summary>
        {L.viewTable}
      </summary>
      {body}
    </details>
  );
}

/* Data table equivalent to a chart: every key of every point, numbers exactly as stored. */
function SeriesTable({ series }) {
  const keys = [];
  series.points.forEach((p) => Object.keys(p).forEach((k) => k !== "bound" && !keys.includes(k) && keys.push(k)));
  return (
    <details className="stats__details">
      <summary>{L.dataTable}</summary>
      <div className="stats__scroll" role="region" aria-labelledby={`chart-${series.id}-tcap`} tabIndex={0}>
        <table className="stats__table">
          <caption id={`chart-${series.id}-tcap`} className="stats__caption">
            {series.title} ({L.unit}: {L.units[series.unit] ?? series.unit})
          </caption>
          <thead>
            <tr>
              {keys.map((k) => (
                <th key={k} scope="col">{L.fields?.[k] ?? k}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {series.points.map((p, r) => (
              <tr key={r}>
                {keys.map((k, i) => (i === 0 ? <th key={k} scope="row">{pointText(p, k, L.noData)}</th> : <td key={k}>{pointText(p, k, L.noData, fmtNum)}</td>))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}

/* Table <-> series pairing: explicit ids first, then "tableId" being the start of the series id. */
const ALIAS = { socc: "soccTrends", bcnIndex: "bcnBirdIndex", cropLosses: "cropLossSeries", parcAgrariCaptures: "parcAgrariCaptureSeries" };
const equivalent = (t, s) =>
  t.series === s.id || ALIAS[t.id] === s.id || s.id.toLowerCase().startsWith(String(t.id).toLowerCase()) || s.id.toLowerCase().replace(/series$/, "") === String(t.id).toLowerCase();

function Series({ series, tables, picker, fallback }) {
  const id = `chart-${series.id}`;
  const shown = { ...series, title: series.title || fallback };
  return (
    <figure className="stats__figure">
      {picker}
      <figcaption id={`${id}-title`} className="stats__fig-title">
        {shown.title} <span className="stats__unit">({L.units[series.unit] ?? series.unit})</span>
      </figcaption>
      <div className="stats__chart">
        <Suspense fallback={<p className="stats__loading" role="status">{L.chartLoading}</p>}>
          <StatsChart key={series.id} series={shown} projectionLabel={L.projection} table={tables[0]} noData={L.noData} />
        </Suspense>
      </div>
      {series.note ? <p className="stats__legend-note">{series.note}</p> : null}
      {tables.length ? tables.map((t) => <Table key={t.id} table={t} folded fallback={shown.title} />) : <SeriesTable series={shown} />}
    </figure>
  );
}

/* Series sharing a `group` get one chart and a button row to switch between them; the group has a single set of tables. */
function SeriesGroup({ items, tables, fallback }) {
  const [current, setCurrent] = useState(items[0].id);
  const series = items.find((x) => x.id === current) ?? items[0];
  const picker = (
    <div className="stats__picker" role="group" aria-label={L.seriesPicker}>
      {items.map((x) => (
        <button key={x.id} type="button" className="stats__picker-btn" aria-pressed={x.id === series.id} onClick={() => setCurrent(x.id)}>
          {x.title || fallback}
        </button>
      ))}
    </div>
  );
  return <Series series={series} tables={tables} picker={picker} fallback={fallback} />;
}

function Visuals({ block }) {
  const tables = block.tables ?? [];
  const list = block.series ?? [];
  const fallback = block.title;
  /* Each table is claimed by the first series (or group) it is equivalent to, so ids never repeat. */
  const claimed = new Set();
  const claim = (items) => {
    const mine = tables.filter((t) => !claimed.has(t.id) && items.some((s) => equivalent(t, s)));
    mine.forEach((t) => claimed.add(t.id));
    return mine;
  };
  const counts = {};
  list.forEach((s) => s.group && (counts[s.group] = (counts[s.group] ?? 0) + 1));
  const done = new Set();
  const charts = list.map((s) => {
    if (s.group && counts[s.group] > 1) {
      if (done.has(s.group)) return null;
      done.add(s.group);
      const items = list.filter((x) => x.group === s.group);
      return <SeriesGroup key={`g-${s.group}`} items={items} tables={claim(items)} fallback={fallback} />;
    }
    return <Series key={s.id} series={s} tables={claim([s])} fallback={fallback} />;
  });
  return (
    <>
      {tables.filter((t) => !claimed.has(t.id)).map((t) => (
        <section key={t.id} id={`tbl-${t.id}`} className="stats__item">
          <Table table={t} fallback={fallback} />
        </section>
      ))}
      {charts}
    </>
  );
}

function Groups({ groups = [] }) {
  return groups.map((g) => (
    <section key={g.id} id={`src-${g.id}`} className="stats__group" aria-labelledby={`src-${g.id}-t`}>
      <h3 id={`src-${g.id}-t`} className="stats__h3">{g.title}</h3>
      <ul className="stats__sources">
        {g.items.map((it, i) => (
          <li key={i}>
            <span>{it.title}</span>
            {it.detail ? <span className="stats__detail"> {it.detail}</span> : null}
            {it.also?.length ? (
              <span className="stats__also">
                {" "}{L.also}:{" "}
                {it.also.map((a, j) => (
                  <span key={j}>
                    {j ? ", " : ""}
                    {a.title}
                  </span>
                ))}
              </span>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  ));
}

function Block({ b }) {
  const callouts = (b.callouts ?? []).filter((c) => c && (c.text || c.title));
  const glossary = (b.glossary ?? []).filter((g) => g && g.text);
  /* "How to read" and "Sources" share the same folding pattern (native <details>: keyboard and aria-expanded built in). */
  const fold = /how.?to.?read|^sources$/i.test(b.id);
  const body = (
    <>
      {b.intro ? <p className="stats__intro">{b.intro}</p> : null}
      <Kpis block={b} />
      {callouts.map((c, i) => (
        <aside key={i} className={`stats__callout stats__callout--${c.kind}`} role="note" aria-label={c.kind === "warning" ? L.warning : L.info}>
          {c.title ? <p className="stats__callout-title">{c.title}</p> : null}
          {c.text ? <p>{c.text}</p> : null}
        </aside>
      ))}
      <Visuals block={b} />
      {glossary.some((g) => g.term) ? (
        <dl className="stats__glossary" aria-label={L.glossary}>
          {glossary.filter((g) => g.term).map((g, i) => (
            <div key={i} className="stats__gloss">
              <dt>{g.term}</dt>
              <dd>{g.text}</dd>
            </div>
          ))}
        </dl>
      ) : null}
      {glossary.filter((g) => !g.term).map((g, i) => (
        <p key={i} className="stats__gloss">
          {g.text}
        </p>
      ))}
      <Groups groups={b.sourceGroups} />
    </>
  );
  return (
    <section id={b.id} className="stats__block" aria-labelledby={`${b.id}-title`}>
      {fold ? (
        <details className="stats__details stats__fold">
          <summary>
            <h2 id={`${b.id}-title`} className="stats__h2 stats__h2--fold">{b.title}</h2>
          </summary>
          {body}
        </details>
      ) : (
        <>
          <h2 id={`${b.id}-title`} className="stats__h2">{b.title}</h2>
          {body}
        </>
      )}
    </section>
  );
}

export default function StatsPage() {
  return (
    <section id="page-stats" className="section stats wave surface-paper" data-surface="paper" data-wave aria-labelledby="page-stats-title">
      <div className="wrap">
        <header className="section-head stats__head">
          <h1 id="page-stats-title" className="h2 stats__title">{stats.title}</h1>
          <p className="lead stats__lead">{stats.lede}</p>
          <p className="stats__updated">{stats.updated}</p>
        </header>
        {(stats.blocks ?? []).map((b) => <Block key={b.id} b={b} />)}
      </div>
    </section>
  );
}
