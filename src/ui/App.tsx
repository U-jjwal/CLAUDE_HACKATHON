import { useEffect, useMemo, useState } from 'react';
import { parseReadings, num, cite, REPORT_FILE } from '../core/clean';
import { rankStability } from '../core/score';
import { profile, carryOver, assessReading } from '../core/insights';
import { exceeds } from '../core/limits';
import type { Reading } from '../core/types';

const TAGS: Record<string, string> = {
  recurring_baseline: 'Low oxygen even before idols arrive (2+ events)',
  immersion_triggered: 'Passes before, fails during immersion',
  slow_recovery: 'Still below oxygen limit a week later (2+ events)',
  organic_load_spike: 'BOD rises 2+ mg/l during immersion',
  data_gap: 'Missing data',
};
const TIER = { A: 'Act first', B: 'Close group', C: 'Lowest concern' } as const;
const PARAMS = ['Dissolved oxygen', 'BOD', 'pH'];
const PH_ORDER = { pre: 0, during: 1, after: 2 } as const;

export default function App() {
  const [rs, setRs] = useState<Reading[] | null>(null);
  const [fest, setFest] = useState<'Durga' | 'Ganesh' | 'All'>('Durga');
  const [open, setOpen] = useState<string | null>(null);
  const [sites, setSites] = useState(['Arch Bridge ghat', 'Barkatullah University campus ghat (new)', 'Sanjeev Nagar ghat (new)', 'Neelbagh ghat (new)']);
  const [site, setSite] = useState('');
  const [ar, setAr] = useState({ ghat: '', param: 'Dissolved oxygen', val: '' });

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}bhopal_ghats_2023_2025.csv`).then(r => r.text()).then(t => setRs(parseReadings(t)));
  }, []);
  const view = useMemo(() => (rs ? (fest === 'All' ? rs : rs.filter(r => r.festival === fest)) : []), [rs, fest]);
  const stab = useMemo(() => (view.length ? rankStability(view, { B: 1000 }) : []), [view]);
  if (!rs) return <div className="wrap">Loading readings...</div>;

  const events = [...new Set(rs.map(r => `${r.year}-${r.festival}`))].sort();
  const cDO = carryOver(rs, 'Dissolved oxygen'), cBOD = carryOver(rs, 'BOD');
  const res = ar.ghat && ar.val !== '' && !Number.isNaN(Number(ar.val)) ? assessReading(rs, ar.ghat, ar.param, Number(ar.val)) : null;

  return (
    <div className="wrap">
      <h1>Visarjan Ghat Watch · Bhopal</h1>
      <p className="sub">Durga visarjan 20 Oct 2026 · MPPCB tests 2023 to 2025 · benchmark: CPCB class B (outdoor bathing) · points to the readings, the officer decides</p>
      <div className="seg">
        {(['Durga', 'Ganesh', 'All'] as const).map(f => <button key={f} className={fest === f ? 'on' : ''} onClick={() => setFest(f)}>{f}</button>)}
      </div>
      <div className="note">
        Ghats start Durga with worse water than Ganesh in {cDO.durgaWorse} of {cDO.n} ghat-years (oxygen) and {cBOD.durgaWorse} of {cBOD.n} (BOD). Small sample, so treat as a warning, not proof.
      </div>

      <h2>Ghats by attention tier ({fest})</h2>
      <p className="mute">Only the extremes are stable: with about 6 events per ghat, the middle ghats cannot be ranked apart, so they share a tier. "Lowest concern" is not "safe": BOD is above 3 mg/l in most readings at every ghat.</p>
      {stab.map(s => {
        const p = profile(view, s.ghat);
        const rows = view.filter(r => r.ghat === s.ghat && PARAMS.includes(r.parameter))
          .sort((a, b) => `${a.year}${a.festival}`.localeCompare(`${b.year}${b.festival}`) || PH_ORDER[a.phase] - PH_ORDER[b.phase] || a.parameter.localeCompare(b.parameter));
        const conf = p.missingEvents.length ? `Lower confidence: no data for ${p.missingEvents.join(', ')}` : p.partialEvents.length ? `Medium confidence: partial data in ${p.partialEvents.join(', ')}` : 'All events sampled';
        return (
          <div className="card" key={s.ghat}>
            <div className="row">
              <span className={`badge ${s.tier}`}>{s.tier} · {TIER[s.tier]}</span>
              <strong className="grow">{s.ghat}</strong><span className="mute">{p.waterBody}</span>
            </div>
            <div>{p.tags.map(t => <span className="tag" key={t}>{TAGS[t]}</span>)}</div>
            <div className="mute">
              Oxygen below 5 mg/l before immersion in {p.doPreFail} of {p.doEvents} complete events · crossed during immersion in {p.doTriggered} · below limit a week after in {p.doAfterFail}. {conf}.
              {' '}Rank in {Math.round(s.pTop2 * 100)}% of resamples: top 2 · bottom 2: {Math.round(s.pBottom2 * 100)}%.
            </div>
            <button className="link" onClick={() => setOpen(open === s.ghat ? null : s.ghat)}>{open === s.ghat ? 'Hide evidence' : 'Show evidence (every number with report and page)'}</button>
            {open === s.ghat && (
              <div className="scroll"><table><thead><tr><th>Event</th><th>Phase</th><th>Parameter</th><th>Value</th><th>Class B</th><th>Source</th></tr></thead><tbody>
                {rows.map((r, i) => {
                  const v = num(r);
                  const out = v === null ? null : exceeds(r.parameter, v);
                  return <tr key={i}><td>{r.year} {r.festival}</td><td>{r.phase}</td><td>{r.parameter}</td>
                    <td>{v !== null ? v : r.state.kind === 'bdl' ? 'BDL' : 'Not sampled'}</td>
                    <td>{out === null ? '-' : out ? 'outside' : 'within'}</td>
                    <td title={REPORT_FILE[r.year]}>{cite(r)}</td></tr>;
                })}
              </tbody></table></div>
            )}
          </div>
        );
      })}

      <h2>What was and was not sampled (oxygen readings)</h2>
      <p className="mute">Hatched grey = not sampled or no table in the report. It is never treated as clean. Columns: each event as pre / during / after.</p>
      <div className="scroll">
        {stab.map(s => (
          <div className="row" key={s.ghat} style={{ margin: '3px 0' }}>
            <span className="mute" style={{ width: 150 }}>{s.ghat.split(' ')[0]}</span>
            <div className="grid" style={{ gridTemplateColumns: `repeat(${events.length * 3}, 18px)` }}>
              {events.flatMap(ev => (['pre', 'during', 'after'] as const).map(ph => {
                const r = rs.find(x => `${x.year}-${x.festival}` === ev && x.ghat === s.ghat && x.parameter === 'Dissolved oxygen' && x.phase === ph);
                const v = r ? num(r) : null;
                const cls = v === null ? 'none' : v < 5 ? 'bad' : 'ok';
                return <div key={ev + ph} className={`cell ${cls}`} title={`${ev} ${ph}: ${v === null ? 'not sampled' : v + ' mg/l'}`} />;
              }))}
            </div>
          </div>
        ))}
        <div className="mute" style={{ marginLeft: 160 }}>{events.join('  ·  ')}</div>
      </div>

      <h2>Sites in use with no test history</h2>
      <div className="card">
        <p className="mute">From a Feb 2026 press report on the NGT ban and new BMC ghats. Confirm the current list with BMC. No data means unknown, not safe: test before use.</p>
        <ul>{sites.map(x => <li key={x}>{x}</li>)}</ul>
        <div className="row"><input value={site} placeholder="Add a site" onChange={e => setSite(e.target.value)} />
          <button onClick={() => { if (site.trim()) { setSites([...sites, site.trim()]); setSite(''); } }}>Add</button></div>
      </div>

      <h2>Add today's reading</h2>
      <div className="card">
        <div className="row">
          <select value={ar.ghat} onChange={e => setAr({ ...ar, ghat: e.target.value })}><option value="">Ghat</option>{stab.map(s => <option key={s.ghat}>{s.ghat}</option>)}</select>
          <select value={ar.param} onChange={e => setAr({ ...ar, param: e.target.value })}>{PARAMS.map(p => <option key={p}>{p}</option>)}</select>
          <input type="number" step="0.1" placeholder="Pre-immersion value" value={ar.val} onChange={e => setAr({ ...ar, val: e.target.value })} />
        </div>
        {res && <p>
          <strong>{res.outsideClassB ? 'Outside' : 'Within'} class B</strong> (limit: {res.limit}).{' '}
          {res.worseThanShareOfPast !== null && `Worse than ${Math.round(res.worseThanShareOfPast * 100)}% of this ghat's ${res.pastReadings} past pre-immersion readings.`}
        </p>}
      </div>

      <h2>Trust and limits</h2>
      <ul className="mute">
        <li>The reports print no units; standard units are assumed. BOD method is not printed (lake reports say 3 days at 27 C, the CPCB table says 5 days at 20 C).</li>
        <li>Class B is a reasonable benchmark for ghats, not an official immersion class. Ghat data has no coliform, which class B also limits.</li>
        <li>Metals have no class B limit and are not comparable across years. 63 numeric 2025 metal values equal detection limits and are treated as likely BDL.</li>
        <li>Bairagarh and Malikhedi have no Durga 2025 table. "Rani Kamlapati / Kamla Park" may be two places.</li>
        <li>Not a health assessment. Tier cutoffs and score weights are judgement calls.</li>
      </ul>
    </div>
  );
}
