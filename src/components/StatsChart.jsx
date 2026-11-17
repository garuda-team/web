import { useEffect, useRef, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, ErrorBar, LabelList, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { motionOK } from "../lib/motion.js";
import { ui } from "../content.js";
import { fmtNum, hasRange, pointText } from "../lib/statsFormat.js";

const L = ui.statsPage;

/* Which keys of each series are drawn. Values pass through untouched; null leaves a gap. */
const SPECS = {
  bcnPopulationSeries: { x: "year", keys: ["value"], column: true },
  soccTrends: { x: "label", keys: ["springSince2002", "winterSince2002"] },
  bcnBirdIndex: { x: "year", pivot: "group", line: true },
  cropLossSeries: { x: "label", keys: ["mean"] },
  parcAgrariCaptureSeries: { x: "label", keys: ["value"] },
  prevalenceSeries: { x: "label", keys: ["value"] },
  spendPeriodsSeries: { x: "label", keys: ["total", "annualAverage"] },
  spendByTypeSeries: { x: "label", keys: ["value"] },
  contractsSeries: { x: "label", keys: ["amount"] },
};
const NOT_VALUES = new Set(["id", "label", "year", "group", "scientific", "origin", "projection", "type", "min", "max", "low", "high", "positives", "sample", "city"]);
const COLORS = ["var(--forest)", "var(--grass)", "var(--ink)"];
const DASHES = [undefined, "6 3", "2 3"];
const TIP = { background: "var(--ink)", color: "var(--paper)", border: "1px solid var(--rule-strong)", borderRadius: "var(--radius-box)", boxShadow: "none" };
const GRID = "color-mix(in srgb, var(--forest) 35%, transparent)";

const humanize = (k) => k.replace(/([a-z])([A-Z0-9])/g, "$1 $2").replace(/^./, (c) => c.toUpperCase());

/* Known spec, or a best guess for series added later. */
function specFor(series) {
  if (SPECS[series.id]) return SPECS[series.id];
  const pts = series.points;
  const x = series.x === "year" ? "year" : pts.some((p) => "label" in p) ? "label" : "year";
  if (pts.some((p) => "group" in p) && pts.some((p) => "year" in p)) return { x: "year", pivot: "group", line: true };
  if (pts.some((p) => "value" in p)) return { x, keys: ["value"], column: x === "year" };
  const keys = [];
  pts.forEach((p) => Object.keys(p).forEach((k) => typeof p[k] === "number" && k !== x && !NOT_VALUES.has(k) && !keys.includes(k) && keys.push(k)));
  return { x, keys: keys.length ? keys : ["value"], column: x === "year" };
}

const num = fmtNum;

/* Tooltip text of a lower bound: the table's own cell ("> 3 M€") when there is one, else pointText. */
function cellText(p, k, keys, x, table) {
  if (p.bound === "min" && table) {
    const row = table.rows.find((r) => String(r[0]) === String(p[x]));
    const cell = row?.[keys.indexOf(k) + 1];
    if (cell && String(cell).trim()) return String(cell);
  }
  return pointText(p, k, L.noData, num);
}

/* Row for the bar chart: a point with no central value but a low-high range becomes a floating bar; a value with low-high gets an error bar. */
function barRows(pts, keys) {
  return pts.map((p) => {
    const row = { ...p, __src: p };
    keys.forEach((k) => {
      if (k === "value" && p.value === null && hasRange(p)) row[k] = [p.low, p.high];
    });
    if (typeof p.value === "number" && hasRange(p)) row.__err = [p.value - p.low, p.high - p.value];
    return row;
  });
}

/* Tooltip that reads the original point: lower bounds, ranges, "no data" and marks come out as in the table. */
function PointTip({ active, payload, label, keys, names, allKeys, x, table }) {
  const p = payload?.[0]?.payload?.__src;
  if (!active || !p) return null;
  return (
    <div className="stats__tip" style={TIP}>
      <p className="stats__tip-title">{label}</p>
      {p.scientific ? <p className="stats__tip-sci"><i lang="la">{p.scientific}</i></p> : null}
      <ul className="stats__tip-list">
        {keys.map((k) => (
          <li key={k}>
            {names[k]}: <strong>{cellText(p, k, allKeys, x, table)}</strong>
          </li>
        ))}
        {typeof p.value === "number" && hasRange(p) ? (
          <li>
            {L.range}: {num(p.low)}–{num(p.high)}
          </li>
        ) : null}
        {p.mark ? <li>{p.mark}</li> : null}
      </ul>
    </div>
  );
}

/* ">" next to the end of a bar whose value is only a lower bound. */
function boundLabel(vertical, pts) {
  return function BoundLabel({ x, y, width, height, index }) {
    const p = pts[index];
    if (!p || p.bound !== "min") return null;
    return (
      <text x={vertical ? x + width + 6 : x + width / 2} y={vertical ? y + height / 2 : y - 6} textAnchor={vertical ? "start" : "middle"} dominantBaseline="middle" fill="var(--fg)" fontWeight="700">
        {">"}
      </text>
    );
  };
}

function Legend({ entries, hidden, toggle }) {
  if (entries.length < 2) return null;
  return (
    <ul className="stats__legend" aria-label={L.legend}>
      {entries.map((e, i) => (
        <li key={e.key}>
          <button type="button" className="stats__legend-btn" aria-pressed={!hidden.has(e.key)} onClick={() => toggle(e.key)}>
            <span className="stats__legend-dot" style={{ background: COLORS[i % COLORS.length], borderRadius: i % 2 ? "var(--radius)" : undefined }} aria-hidden="true" />
            {e.name}
          </button>
        </li>
      ))}
    </ul>
  );
}

/* Wraps a label into lines of at most `max` characters; over-long words are split, never cut. */
function wrapLabel(text, max) {
  if (text == null) return [];
  const lines = [];
  let cur = "";
  String(text).split(/\s+/).forEach((w) => {
    while (w.length > max) {
      if (cur) lines.push(cur);
      lines.push(w.slice(0, max));
      cur = "";
      w = w.slice(max);
    }
    if (!cur) cur = w;
    else if ((cur + " " + w).length <= max) cur += " " + w;
    else {
      lines.push(cur);
      cur = w;
    }
  });
  if (cur) lines.push(cur);
  return lines;
}

/* Category tick drawn as stacked lines so long labels never overlap the neighbouring rows. */
function WrapTick({ x, y, payload, max, fontSize }) {
  const lines = wrapLabel(payload.value == null ? "" : payload.value, max);
  const lh = fontSize * 1.25;
  return (
    <text x={x - 6} y={y - ((lines.length - 1) * lh) / 2} textAnchor="end" dominantBaseline="central" fill="var(--fg)" fontSize={fontSize}>
      {lines.map((l, i) => (
        <tspan key={i} x={x - 6} dy={i ? lh : 0}>
          {l}
        </tspan>
      ))}
    </text>
  );
}

/* Width (px) of the widest formatted tick label, plus room for the axis line. */
const tickWidth = (labels, fontSize = 12) => Math.ceil(Math.max(...labels.map((l) => String(l).length), 1) * fontSize * 0.6) + 16;

/* Formatted labels the numeric axis can show: every value (incl. low/high) plus the next power of ten, which bounds Recharts' rounded-up top tick. */
function axisLabels(nums) {
  const v = nums.filter((n) => typeof n === "number" && Number.isFinite(n));
  const top = Math.max(0, ...v.map(Math.abs));
  const nice = top > 0 ? 10 ** Math.ceil(Math.log10(top)) : 0;
  const neg = v.some((n) => n < 0) ? -nice : nice;
  return [...v, nice, neg].map((n) => num(n));
}

function Frame({ title, children, innerRef }) {
  return (
    <div className="stats__plot" role="figure" aria-label={title} ref={innerRef}>
      {children}
    </div>
  );
}

export default function StatsChart({ series, projectionLabel, table }) {
  const spec = specFor(series);
  const animate = motionOK();
  const pts = series.points;
  const [hidden, setHidden] = useState(() => new Set());
  const plotRef = useRef(null);
  const [W, setW] = useState(360);
  useEffect(() => {
    const el = plotRef.current;
    if (!el) return undefined;
    const read = () => setW(el.clientWidth || 360);
    read();
    if (typeof ResizeObserver === "undefined") return undefined;
    const ro = new ResizeObserver(read);
    ro.observe(el);
    return () => ro.disconnect();
  }, [spec.line]);
  const toggle = (k) =>
    setHidden((h) => {
      const n = new Set(h);
      if (n.has(k)) n.delete(k);
      else n.add(k);
      return n;
    });

  if (spec.line) {
    /* One line per group; years are the shared x axis. */
    const groups = [...new Set(pts.map((p) => p[spec.pivot]))];
    const labels = Object.fromEntries(pts.map((p) => [p[spec.pivot], p.label ?? String(p[spec.pivot])]));
    const xs = [...new Set(pts.map((p) => p[spec.x]))];
    const numericX = xs.length > 1 && xs.every((x) => Number.isInteger(x));
    /* Years with no data get an empty row so the numeric axis leaves a real gap (no invented values). */
    if (numericX) for (let y = Math.min(...xs) + 1; y < Math.max(...xs); y++) if (!xs.includes(y)) xs.push(y);
    xs.sort((a, b) => a - b);
    const rows = xs.map((x) => {
      const row = { [spec.x]: x };
      groups.forEach((g) => {
        row[g] = pts.find((p) => p[spec.x] === x && p[spec.pivot] === g)?.value ?? null;
      });
      return row;
    });
    const trends = (series.trend || []).filter((t) => groups.includes(t.group));
    const tkey = (t) => `trend:${t.group}`;
    trends.forEach((t) =>
      rows.forEach((r) => {
        const y = r[spec.x];
        r[tkey(t)] = y >= t.from && y <= t.to ? t.start + ((t.end - t.start) * (y - t.from)) / (t.to - t.from) : null;
      }),
    );
    const entries = [...groups.map((g) => ({ key: g, name: labels[g] })), ...trends.map((t) => ({ key: tkey(t), name: t.label }))];
    const colorOf = (g) => COLORS[groups.indexOf(g) % COLORS.length];
    return (
      <>
        <Legend entries={entries} hidden={hidden} toggle={toggle} />
        <Frame title={series.title} innerRef={plotRef}>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={rows} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
            <CartesianGrid stroke={GRID} strokeDasharray="3 3" />
            <XAxis dataKey={spec.x} stroke="var(--fg)" tick={{ fill: "var(--fg)" }} {...(numericX ? { type: "number", domain: ["dataMin", "dataMax"], allowDecimals: false, tickFormatter: String } : {})} />
            <YAxis stroke="var(--fg)" tick={{ fill: "var(--fg)" }} width={tickWidth(axisLabels(rows.flatMap((r) => groups.map((g) => r[g]))))} tickFormatter={num} />
            <Tooltip contentStyle={TIP} itemStyle={{ color: "var(--paper)" }} labelStyle={{ color: "var(--paper)" }} formatter={(v) => num(v)} />
            {groups.map((g, i) => (
              <Line key={g} dataKey={g} name={labels[g]} hide={hidden.has(g)} stroke={COLORS[i % COLORS.length]} strokeWidth={2} strokeDasharray={DASHES[i % DASHES.length]} dot={{ r: 3 + (i % 3) }} activeDot={{ r: 6 }} connectNulls={false} isAnimationActive={animate} />
            ))}
            {trends.map((t) => (
              <Line key={tkey(t)} dataKey={tkey(t)} name={t.label} hide={hidden.has(tkey(t))} stroke={colorOf(t.group)} strokeWidth={1.5} strokeDasharray="6 4" tooltipType="none" dot={false} activeDot={false} connectNulls={false} isAnimationActive={animate} />
            ))}
          </LineChart>
        </ResponsiveContainer>
        </Frame>
        {trends.length && series.trendNote ? <p className="stats__legend-note">{series.trendNote}</p> : null}
      </>
    );
  }

  const vertical = !spec.column;
  const visibleKeys = spec.keys.filter((k) => !hidden.has(k));
  const narrow = W < 480;
  const fontSize = narrow ? 11 : 12;
  const yW = narrow ? Math.max(96, Math.round(W * 0.34)) : 180;
  const maxChars = Math.max(6, Math.floor((yW - 10) / (fontSize * 0.58)));
  const maxLines = vertical ? Math.max(1, ...pts.map((p) => wrapLabel(p[spec.x], maxChars).length)) : 1;
  const rowH = Math.max(34, Math.ceil(maxLines * fontSize * 1.25) + 16);
  const height = vertical ? Math.max(240, pts.length * rowH * Math.max(1, visibleKeys.length) + 60) : 300;
  const hasProjection = pts.some((p) => p.projection);
  const entries = spec.keys.map((k) => ({ key: k, name: L.fields?.[k] ?? humanize(k) }));
  const names = Object.fromEntries(entries.map((e) => [e.key, e.name]));
  const rows = barRows(pts, spec.keys);
  const hasBound = pts.some((p) => p.bound === "min");
  const hasRangeOnly = pts.some((p) => p.value === null && hasRange(p));
  return (
    <>
      <Legend entries={entries} hidden={hidden} toggle={toggle} />
      <Frame title={series.title} innerRef={plotRef}>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={rows} layout={vertical ? "vertical" : "horizontal"} margin={{ top: 16, right: hasBound ? 32 : 16, bottom: 8, left: 0 }}>
          <CartesianGrid stroke={GRID} strokeDasharray="3 3" />
          {vertical ? (
            <>
              <XAxis type="number" stroke="var(--fg)" tick={{ fill: "var(--fg)" }} tickFormatter={num} />
              <YAxis type="category" dataKey={spec.x} width={yW} stroke="var(--fg)" tick={<WrapTick max={maxChars} fontSize={fontSize} />} interval={0} />
            </>
          ) : (
            <>
              <XAxis dataKey={spec.x} stroke="var(--fg)" tick={{ fill: "var(--fg)" }} />
              <YAxis stroke="var(--fg)" tick={{ fill: "var(--fg)" }} width={tickWidth(axisLabels(pts.flatMap((p) => [...spec.keys.map((k) => p[k]), p.low, p.high])))} tickFormatter={num} />
            </>
          )}
          <Tooltip content={<PointTip keys={visibleKeys} names={names} allKeys={spec.keys} x={spec.x} table={table} />} cursor={{ fill: GRID }} />
          {spec.keys.map((k, i) => (
            <Bar key={k} dataKey={k} name={L.fields?.[k] ?? humanize(k)} hide={hidden.has(k)} fill={COLORS[i % COLORS.length]} isAnimationActive={animate}>
              {pts.map((p, j) => {
                const dashed = p.projection || (k === "value" && p.value === null && hasRange(p));
                return <Cell key={j} fill={COLORS[i % COLORS.length]} fillOpacity={dashed ? 0.55 : 1} stroke={dashed ? COLORS[i % COLORS.length] : "none"} strokeWidth={dashed ? 2 : 0} strokeDasharray={dashed ? "4 3" : undefined} />;
              })}
              {k === "value" && pts.some((p) => typeof p.value === "number" && hasRange(p)) ? <ErrorBar dataKey="__err" stroke="var(--ink)" strokeWidth={2} width={6} isAnimationActive={animate} /> : null}
              {hasBound ? <LabelList dataKey={k} content={boundLabel(vertical, pts)} /> : null}
            </Bar>
          ))}
        </BarChart>
      </ResponsiveContainer>
      </Frame>
      {hasProjection ? (
        <p className="stats__legend-note">
          <span className="stats__swatch" aria-hidden="true" /> {projectionLabel}:{" "}
          {pts.filter((p) => p.projection).map((p) => p[spec.x]).join(", ")}
        </p>
      ) : null}
      {hasBound || hasRangeOnly ? (
        <p className="stats__legend-note">
          {hasBound ? `> ${L.boundNote}` : null}
          {hasBound && hasRangeOnly ? " · " : null}
          {hasRangeOnly ? L.rangeNote : null}
        </p>
      ) : null}
    </>
  );
}
